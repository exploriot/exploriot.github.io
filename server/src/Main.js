import http from "http";
import {WebSocketServer} from "ws";
import express from "express";
import {Terminal} from "./terminal/Terminal.js";
import {S_Player} from "./entity/Player.js";
import "./Server.js";
import "../../client/common/metadata/Blocks.js";
import "../../client/common/metadata/Items.js";
import {appendFileSync, existsSync, mkdirSync, readFileSync} from "fs";
import {Item} from "../../client/common/item/Item.js";
import {PacketIds} from "../../client/common/metadata/PacketIds.js";
import {_TA} from "../../client/common/Utils.js";
import {DisconnectPacket} from "./packet/DisconnectPacket.js";

export const SERVER_BEGIN_TIME = Date.now();
const app = express();
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.url === "/") {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end("block-game");
        return;
    }
    next();
});
const server = http.createServer(app);

if (!existsSync("./worlds")) mkdirSync("./worlds");
if (!existsSync("./players")) mkdirSync("./players");
if (!existsSync("./logs")) mkdirSync("./logs");

// todo: make the serialized chunks smaller in size, airs should not be shown in the json, do something like "1000 air after this"
// todo: when closing inventory cursor and craft inventory should be emptied, in server-side when player sends move packet do the same thing
// todo: cow
// todo: hitboxes
// todo: health, living entity class
// todo: scoreboard
// todo: saturation
// todo: if someone drops someone else an item and the player with the item quits and before the dropper leaves the server crashes,
//  the dropper would get his items back therefore duping the item.

// todo: check out multiplayer interpolation (smoothed the movement, kinda)
// todo: water is broken
// todo: when teleporting to someone/somewhere, it doesn't load the surrounding entities, sometimes

const wss = new WebSocketServer({server});

process.on("SIGINT", () => {
    Terminal.warn("A key interruption was caught.");
    Server.stop();
});

let lastUpdate = Date.now() - 1;

/*world.generator = new CustomGenerator(world,
    `${Ids.BEDROCK};${Ids.STONE};${Ids.STONE};${Ids.STONE};${Ids.STONE};${Ids.STONE};${Ids.DIRT};${Ids.DIRT};${Ids.DIRT};${Ids.GRASS_BLOCK}`
);*/

wss.on("connection", (ws, req) => {
    let hasAuth = false;
    const T = Date.now();
    /*** @type {S_Player} */
    let player;
    ws.active = true;
    ws.disconnectReason = null;
    ws.ipAddress = req.socket.remoteAddress;

    ws.onDisconnect = () => {
        if (!ws.active) return;
        ws.active = false;
        if (!player) return;
        Terminal.info(`§7[${player.username} ${ws.ipAddress} disconnected for "${ws.disconnectReason ?? "client disconnect"}§7"]`);
        lastBroadcastPlayerList = Date.now();
        Server.broadcastPlayerList();
        Server.broadcastMessage(`§e${player.username} left the server.`);
        Server.getPlayers().delete(player);
        player.remove(false);
        player.broadcastDespawn();
        player.save();
    };

    function kick(reason) {
        ws.disconnectReason = reason;
        ws.send(JSON.stringify(DisconnectPacket(reason)));
        ws.onDisconnect();
        setTimeout(() => ws.close(), 1000);
    }

    ws.on("error", () => {
        kick("Internal server error.");
    });

    let authInt = setTimeout(() => {
        if (!hasAuth) kick("Timed out.");
    }, 5000);

    ws.on("close", ws.onDisconnect);

    ws.on("message", pk => {
        if (!ws.active) return;
        try {
            pk = JSON.parse(pk);
        } catch (e) {
            return kick("Invalid packet.");
        }
        try {
            if (player) appendFileSync("./logs/" + player.username + "-" + T + ".txt", "\n" + JSON.stringify(pk));
            if (!hasAuth) {
                if (pk.type !== PacketIds.CLIENT_AUTH) return kick("Expected an auth packet.");
                _TA(
                    pk.username, "string",
                    pk.skinData, "string"
                );
                if (!/^[a-zA-Z\d]{1,16}$/.test(pk.username)) return kick("Invalid username.");
                if (Array.from(Server.getPlayers()).some(i => i.username === pk.username)) return kick("You are already in the server.");
                hasAuth = true;
                ws.player = player = new S_Player(ws, Server.getDefaultWorld(), pk.username, pk.skinData);
                Terminal.info(`§7[${pk.username} ${ws.ipAddress} connected]`);
                Server.getPlayers().add(player);
                if (existsSync("./players/" + pk.username + ".json")) {
                    const data = JSON.parse(readFileSync("./players/" + pk.username + ".json", "utf-8"));
                    player.x = data.x;
                    player.y = data.y;
                    player.vx = data.vx;
                    player.vy = data.vy;
                    Object.assign(player.attributes, data.attributes);
                    player.playerInventory.contents = data.playerInventory.map(Item.deserialize);
                    player.cursorInventory.contents = data.cursorInventory.map(Item.deserialize);
                    player.craftInventory.contents = data.craftInventory.map(Item.deserialize);
                    player.armorInventory.contents = data.armorInventory.map(Item.deserialize);
                    player.handIndex = data.handIndex;
                } else {
                    const spawn = player.getWorld().getSafeSpawnLocation();
                    player.teleport(spawn.x, spawn.y);
                }
                player.world.addEntity(player);
                player.session.sendAttributes();
                player.session.sendPosition();
                player.session.requestPing();
                player.session.sendInventories();
                player.session.sendHandItemIndex();
                player.session.sendWelcomePacket();
                clearTimeout(authInt);
                Server.broadcastMessage(`§e${player.username} joined the server.`);
                lastBroadcastPlayerList = Date.now();
                Server.broadcastPlayerList();
                return;
            }
            if (!player.session.active) return;
            player.session.handlePacket(pk);
        } catch (e) {
            Terminal.error(e);
            if (player) player.kick("§cInternal server error.");
            else kick("§cInvalid authentication packet.");
        }
    });
});

let lastBroadcastPlayerList = Date.now();

function update() {
    const dt = (Date.now() - lastUpdate) / 1000;
    lastUpdate = Date.now();
    for (const world of Server.getWorlds()) {
        world.update(dt);
    }
    const updatingEntities = new Set;
    const updatingTiles = new Set;
    for (const player of Server.getPlayers()) {
        player.session.cleanPackets();
        const cx = player.x >> 4;
        const chunkDistance = Server.getChunkDistance();
        for (let x = cx - chunkDistance; x < cx + chunkDistance; x++) {
            player.session.sendChunk(x);
            if (x in player.world.chunkEntities) for (const entity of player.world.chunkEntities[x]) updatingEntities.add(entity);
            if (x in player.world.chunkTiles) for (const tile of player.world.chunkTiles[x]) updatingTiles.add(tile);
        }
    }
    for (const entity of updatingEntities) entity.update(dt);
    for (const tile of updatingTiles) {
        tile.__updateCounter += dt;
        if (tile.__updateCounter >= tile.updatePeriod) {
            tile.__updateCounter = 0;
            tile.update(dt);
        }
    }

    if (Date.now() - lastBroadcastPlayerList > 5000) {
        lastBroadcastPlayerList = Date.now();
        Server.broadcastPlayerList();
    }

    setTimeout(update);
}

update();

server.listen(1881);

Server.init();