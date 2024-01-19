import http from "http";
import * as IO from "socket.io";
import express from "express";
import {S_Player} from "./entity/Player.js";
import "../../client/common/metadata/Blocks.js";
import "../../client/common/metadata/Items.js";
import {appendFileSync, existsSync, mkdirSync, readFileSync} from "fs";
import {Item} from "../../client/common/item/Item.js";
import {PacketIds} from "../../client/common/metadata/PacketIds.js";
import {_T} from "../../client/common/Utils.js";
import {DisconnectPacket} from "./packet/DisconnectPacket.js";
import {startCommandReader, Terminal} from "./terminal/Terminal.js";
import {S_Server} from "./Server.js";

const T = Date.now();
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

const io = new IO.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

process.on("SIGINT", () => {
    Terminal.send("§4A key interruption was caught.");
    S_Server.stop();
});

let lastUpdate = Date.now() - 1;

S_Server.init();

/*world.generator = new CustomGenerator(world,
    `${Ids.BEDROCK};${Ids.STONE};${Ids.STONE};${Ids.STONE};${Ids.STONE};${Ids.STONE};${Ids.DIRT};${Ids.DIRT};${Ids.DIRT};${Ids.GRASS_BLOCK}`
);*/

io.on("connection", ws => {
    let hasAuth = false;
    const T = Date.now();
    /*** @type {S_Player} */
    let player;

    function kick(reason) {
        ws.emit("packet", DisconnectPacket(reason));
        ws.disconnect();
    }

    setTimeout(() => {
        if (!hasAuth) kick("Timed out.");
    }, 5000);

    ws.on("disconnect", () => {
        if (!player) return;
        player.save();
        S_Server.broadcastMessage(`§e${player.username} left the server.`);
        S_Server.getPlayers().delete(player);
        player.remove();
        player.broadcastDespawn();
    });

    ws.on("packet", pk => {
        try {
            if (player) appendFileSync("./logs/" + player.username + "-" + T + ".txt", "\n" + JSON.stringify(pk));
            if (!hasAuth) {
                if (pk.type !== PacketIds.CLIENT_AUTH) return kick("Expected an auth packet.");
                _T(pk.username, "string");
                if (!/^[a-zA-Z\d]{1,16}$/.test(pk.username)) return kick("Invalid username.");
                if (Array.from(S_Server.getPlayers()).some(i => i.username === pk.username)) return kick("You are already in the server.");
                hasAuth = true;
                ws.player = player = new S_Player(ws, S_Server.getDefaultWorld(), pk.username);
                S_Server.getPlayers().add(player);
                if (existsSync("./players/" + pk.username + ".json")) {
                    const data = JSON.parse(readFileSync("./players/" + pk.username + ".json", "utf-8"));
                    player.x = data.x;
                    player.y = data.y;
                    player.vx = data.vx;
                    player.vy = data.vy;
                    player.attributes = data.attributes;
                    player.playerInventory.contents = data.playerInventory.map(Item.deserialize);
                    player.cursorInventory.contents = data.cursorInventory.map(Item.deserialize);
                    player.craftInventory.contents = data.craftInventory.map(Item.deserialize);
                    player.armorInventory.contents = data.armorInventory.map(Item.deserialize);
                    player.handIndex = data.handIndex;
                } else {
                    const spawn = player.getWorld().getSafeSpawnLocation();
                    player.teleport(spawn.x, spawn.y);
                    // player.playerInventory.add(new Item(Ids.PLANKS, 0, 32));
                }
                player.world.addEntity(player);
                player.session.sendWelcomePacket();
                player.session.sendAttributes();
                player.session.sendPosition();
                player.session.requestPing();
                player.session.sendInventory();
                player.session.sendHandItemIndex();
                S_Server.broadcastMessage(`§e${player.username} joined the server.`);
                return;
            }
            player.session.handlePacket(pk);
        } catch (e) {
            console.error(e);
            if (player) player.kick("Failed to process packet.");
            else kick("Invalid auth packet.");
        }
    });
});

function update() {
    const dt = (Date.now() - lastUpdate) / 1000;
    lastUpdate = Date.now();
    for (const world of S_Server.getWorlds()) {
        world.update(dt);
    }
    for (const player of S_Server.getPlayers()) {
        player.session.cleanPackets();
    }
    setTimeout(update);
}

update();

server.listen(1881);

Terminal.send("Server has been loaded in " + (Date.now() - T) / 1000 + "s. Type 'help' to see the command list.");
startCommandReader();