import {existsSync, readFileSync, writeFileSync} from "fs";
import {S_World} from "./world/World.js";
import {startCommandReader, Terminal} from "./terminal/Terminal.js";
import {ConsoleCommandSender} from "./command/ConsoleCommandSender.js";
import {SERVER_BEGIN_TIME} from "./Main.js";
import {S_Player} from "./entity/Player.js";
import {initCommands} from "./command/CommandManager.js";
import {initBlocks} from "../../client/common/metadata/Blocks.js";
import {initCrafts} from "../../client/common/metadata/Crafts.js";
import {initItems} from "../../client/common/metadata/Items.js";
import {ObjectTag} from "../../client/common/compound/ObjectTag.js";
import {StringTag} from "../../client/common/compound/StringTag.js";

export const S_Server = {
    /*** @type {Set<S_Player>} */
    players: new Set,
    /*** @type {Set<string>} */
    ops: new Set((existsSync("./ops.txt") ? readFileSync("./ops.txt", "utf8") : "").split("\n")),
    /*** @type {S_World[]} */
    worlds: [],
    chunkDistance: 3,
    ups: 0,

    init() {
        initCommands();
        initItems();
        initBlocks();
        initCrafts();

        if (this.ops.size === 1 && !Array.from(this.ops)[0]) this.ops.clear();

        const overworld = new S_World(0, "overworld", new ObjectTag({
            generatorName: new StringTag("flat")
        }));

        this.worlds.push(overworld);
        this.defaultWorld = overworld;

        for (let x = -this.chunkDistance - 1; x <= this.chunkDistance + 1; x++) {
            overworld.loadChunk(x);
        }

        Terminal.info("Server has been loaded in " + (Date.now() - SERVER_BEGIN_TIME) / 1000 + "s. Type 'help' to see the command list.");
        startCommandReader();
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
        if (!(sender instanceof S_Player) && typeof sender !== "string") return false;
        return this.ops.has(typeof sender === "string" ? sender : sender.username);
    },
    addOp(player, save = true) {
        if (!(player instanceof S_Player) && typeof player !== "string") return false;
        this.ops.add(typeof player === "string" ? player : player.username);
        if (save) this.saveOps();
    },
    removeOp(player, save = true) {
        if (!(player instanceof S_Player) && typeof player !== "string") return false;
        this.ops.delete(typeof player === "string" ? player : player.username);
        if (save) this.saveOps();
    },
    broadcastMessage(message) {
        for (const player of this.getPlayers()) {
            player.sendMessage(message);
        }
        Terminal.info(message);
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
        Terminal.warn("Stopping the server...");
        for (const world of this.getWorlds()) world.save();
        Terminal.info("Saved the worlds.");
        for (const player of this.getPlayers()) {
            player.kick("§cServer was remotely closed.");
            player.save();
        }
        Terminal.info("Saved and kicked players.");
        process.exit(0);
    },
    crash(error) {
        Terminal.error(error);
        this.stop();
    },
    broadcastPlayerList() {
        for (const player of this.getPlayers()) {
            player.session.sendPlayerList();
        }
    }
};

global.Server = S_Server;