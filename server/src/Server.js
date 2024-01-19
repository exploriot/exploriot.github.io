import {existsSync, readFileSync, writeFileSync} from "fs";
import {S_World} from "./world/World.js";
import {Terminal} from "./terminal/Terminal.js";
import {ConsoleCommandSender} from "./command/ConsoleCommandSender.js";

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
        return this.ops.has(sender.username);
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
    }
};