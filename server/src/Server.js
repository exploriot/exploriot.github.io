import {existsSync, readFileSync, writeFileSync} from "fs";
import {S_World} from "./world/World.js";
import {startCommandReader, Terminal} from "./terminal/Terminal.js";
import {ConsoleCommandSender} from "./command/ConsoleCommandSender.js";
import {SERVER_BEGIN_TIME} from "./Main.js";

export const S_Server = {
    /*** @type {Set<S_Player>} */
    players: new Set,
    /*** @type {Set<string>} */
    ops: new Set((existsSync("./ops.txt") ? readFileSync("./ops.txt", "utf8") : "").split("\n")),
    /*** @type {S_World[]} */
    worlds: [],
    chunkDistance: 3,

    init() {
        const overworld = new S_World(0, "overworld", {
            generatorType: "default"
        });

        this.worlds.push(overworld);
        this.defaultWorld = overworld;

        for (let x = -this.chunkDistance - 1; x <= this.chunkDistance + 1; x++) {
            overworld.loadChunk(x);
        }
    },
    getDefaultWorld() {
        return this.defaultWorld;
    },
    getWorlds() {
        return this.worlds;
    },
    getChunkDistance() {
        return this.chunkDistance;
    },
    getPlayers() {
        return this.players;
    },
    saveOps() {
        writeFileSync("./ops.txt", Array.from(this.ops).join("\n"));
    },
    isOp(sender) {
        if (sender === ConsoleCommandSender) return true;
        return this.ops.has(typeof sender === "string" ? sender : sender.username);
    },
    addOp(player, save = true) {
        this.ops.add(typeof player === "string" ? player : player.username);
        if (save) this.saveOps();
    },
    removeOp(player, save = true) {
        this.ops.delete(typeof player === "string" ? player : player.username);
        if (save) this.saveOps();
    },
    broadcastMessage(message) {
        for (const player of this.getPlayers()) {
            player.sendMessage(message);
        }
        Terminal.send(message);
    },
    /**
     * @param {string} name
     * @return {S_Player | null}
     */
    getPlayerByName(name) {
        for (const player of this.getPlayers()) {
            if (player.username === name) return player;
        }
        return null;
    },
    getPlayerByPrefix(prefix) {
        prefix = prefix.toLowerCase();
        for (const player of this.getPlayers()) {
            if (player.username.toLowerCase().startsWith(prefix)) return player;
        }
        return null;
    },
    onLoad() {
        Terminal.send("Server has been loaded in " + (Date.now() - SERVER_BEGIN_TIME) / 1000 + "s. Type 'help' to see the command list.");
        startCommandReader();
    },
    stop() {
        Terminal.send("§4Stopping the server...");
        for (const world of this.getWorlds()) world.save();
        Terminal.send("§7Saved the worlds.");
        for (const player of this.getPlayers()) {
            player.kick("§4Server was remotely closed.");
            player.save();
        }
        Terminal.send("§7Saved and kicked players.");
        process.exit(0);
    },
    crash(error) {
        Terminal.error(error);
        this.stop();
    }
};

global.Server = S_Server;