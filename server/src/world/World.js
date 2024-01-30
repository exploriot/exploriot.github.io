import {World} from "../../../client/common/world/World.js";
import {randInt, SelfAround} from "../../../client/common/Utils.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {BlockUpdatePacket} from "../packet/BlockUpdatePacket.js";
import {S_FallingBlockEntity} from "../entity/FallingBlockEntity.js";
import {S_ItemEntity} from "../entity/ItemEntity.js";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import {EntityIds} from "../../../client/common/metadata/Entities.js";
import {Generators} from "./GeneratorManager.js";
import {FlowerIds, getBlockDigSound, getBlockDrops} from "../../../client/common/metadata/Blocks.js";
import {TileBlockIdMap, TileIds} from "../tile/Tile.js";
import {FurnaceTile} from "../tile/FurnaceTile.js";
import {ChestTile} from "../tile/ChestTile.js";
import {S_XPOrbEntity} from "../entity/XPOrbEntity.js";
import {S_TNTEntity} from "../entity/TNTEntity.js";
import {GameRules} from "../../../client/common/metadata/GameRules.js";
import {S_Player} from "../entity/Player.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Int8Tag} from "../../../client/common/compound/int/Int8Tag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {ItemTag} from "../../../client/common/compound/ItemTag.js";

/*** @type {{[key: number]: function(world: S_World, x: number, y: number, self: [number, number]): void}} */
const BlockUpdater = {
    [Ids.SAND](world, x, y, self) {
        const down = world.getBlock(x, y - 1);
        if (!Metadata.phaseable.includes(down[0])) return;
        world.setBlock(x, y, Ids.AIR);
        const sand = new S_FallingBlockEntity(world, new ObjectTag({
            blockId: new Int8Tag(self[0]),
            blockMeta: new Int8Tag(self[1]),
            x: new Float32Tag(x),
            y: new Float32Tag(y)
        }));
        world.addEntity(sand);
    },
    [Ids.SPONGE]: (world, X, Y) => {
        let soaked = 0;
        const maxSoak = 16;
        const soakRadius = 3;
        for (let x = X - soakRadius; x <= Y + soakRadius; x++) {
            if (soaked >= maxSoak) break;
            for (let y = Y - soakRadius; y <= Y + soakRadius; y++) {
                if (soaked >= maxSoak) break;
                const b = world.getBlock(x, y);
                if (b[0] === Ids.WATER) {
                    world.setBlock(x, y, Ids.AIR);
                    soaked++;
                }
            }
        }
        if (soaked) world.setBlock(X, Y, Ids.WET_SPONGE);
    },
    [Ids.WATER](world, X, Y, self) {
        // source     ->  0
        // connection ->  1-7
        // flowing    ->  8
        const waterCanBreak = [Ids.AIR, Ids.GRASS_DOUBLE, Ids.GRASS, ...FlowerIds];
        if (self[1] > 8) {
            self[1] = 0;
            world.setBlock(X, Y, self[0]);
        }

        const down = world.getBlock(X, Y - 1);
        if (waterCanBreak.includes(down[0])) { // move down
            if (down[0] !== Ids.AIR) {
                world.breakBlock(X, Y - 1);
            }
            world.setBlock(X, Y - 1, self[0], 8);
        } else if (down[0] === self[0]) {
            if (down[1] !== 8 && down[1] !== 0) {
                world.setBlock(X, Y - 1, self[0], 8);
            }
        }

        if ((down[0] !== Ids.AIR || self[1] === 0) && (!Metadata.liquid.includes(down[0]) || self[1] === 0) && self[1] !== 7) { // move right and left
            const nextMeta = self[1] === 8 ? 1 : self[1] + 1;
            [1, -1].forEach(dx => {
                const b = world.getBlock(X + dx, Y);
                if (waterCanBreak.includes(b[0])) {
                    if (b[0] !== Ids.AIR) world.breakBlock(X + dx, Y);
                } else if (b[0] === self[0]) {
                    if (b[1] <= nextMeta || b[1] === 8) return;
                } else return;
                world.setBlock(X + dx, Y, self[0], nextMeta);
            });
        }

        if (self[1] > 0 && self[1] < 8) { // removal of small waters
            const left = world.getBlock(X - 1, Y);
            const right = world.getBlock(X + 1, Y);
            if (!((left[0] === self[0] && (left[1] === 8 || left[1] === 0 || left[1] < self[1])) ||
                (right[0] === self[0] && (right[1] === 8 || right[1] === 0 || right[1] < self[1])))) world.setBlock(X, Y, Ids.AIR);
        } else if (self[1] === 8) { // removal of flowing waters
            const up = world.getBlock(X, Y + 1);
            if (up[0] !== self[0]) world.setBlock(X, Y, Ids.AIR);
        }
    }
};

BlockUpdater[Ids.GRAVEL] = BlockUpdater[Ids.ANVIL] = BlockUpdater[Ids.SAND];

export function generateSeed() {
    return randInt(0, 9999999999999);
}

export class S_World extends World {
    dirtyChunks = new Set;
    data = {};
    dirtyUpdateBlocks = new Set;

    // worldX, worldY
    /*** @type {Record<number, S_Entity[]>} */
    chunkEntities = {};

    // worldX, worldY
    /*** @type {Record<number, Record<number, Tile>>} */
    tiles = {};

    // chunkX
    /*** @type {Record<number, Tile[]>} */
    chunkTiles = {};

    /**
     * @param {number} id
     * @param {string} name
     * @param init
     */
    constructor(id, name, init = {}) {
        super(id);
        this.name = name;
        this.path = "./worlds/" + name;
        this._info = init ?? {};
        if (!existsSync(this.path)) mkdirSync(this.path);
        if (!existsSync(this.path + "/chunks")) mkdirSync(this.path + "/chunks");
        if (!existsSync(this.path + "/world.json")) {
            this._info = Object.assign({
                generator: "default",
                generatorOptions: "",
                seed: generateSeed(),
                gameRules: {},
                playerSpawnPoints: {}
            }, this._info);
            this._info.gameRules = Object.assign({
                [GameRules.TNT_EXPLODES]: true,
                [GameRules.FALL_DAMAGE]: true,
                [GameRules.NATURAL_REGENERATION]: true,
                [GameRules.STARVE_DAMAGE]: true,
                [GameRules.DROWNING_DAMAGE]: true
            }, this._info.gameRules);
            writeFileSync(this.path + "/world.json", JSON.stringify(this._info));
        } else {
            this._info = JSON.parse(readFileSync(this.path + "/world.json", "utf8"));
        }
        this.generator = new (Generators[this.getGeneratorType()])(this, this.getGeneratorOptions());
    };

    getGameRule(id) {
        return this._info.gameRules[id];
    };

    setGameRule(id, value) {
        this._info.gameRules[id] = value;
    };

    breakBlock(x, y, breakItem = null, instant = false, sound = true) {
        if (!instant) this.summonBlockDrops(x, y, breakItem);
        if (sound) {
            const id = this.getBlock(x, y)[0];
            const sound = getBlockDigSound(id);
            if (sound) this.playSound(sound, x, y);
        }
        this.setBlock(x, y, Ids.AIR);
        this.checkTile(x, y);
    };

    summonBlockDrops(x, y, breakItem = null) {
        const block = this.getBlock(x, y);
        const drops = getBlockDrops(block[0], block[1], breakItem);
        for (const item of drops) {
            this.dropItem(x, y, item);
        }
    };

    getPlayerSpawnLocation(name) {
        return this._info.playerSpawnPoints[name] ?? this.getSafeSpawnLocation();
    };

    setPlayerSpawnLocation(name, x, y) {
        this._info.playerSpawnPoints[name] = {x, y};
    };

    getSpawnLocation() {
        return this.generator.getSpawnLocation();
    };

    getSafeSpawnLocation() {
        const loc = this.getSpawnLocation();
        return {x: loc.x, y: this.getHighestYAt(loc.x)};
    };

    getSeed() {
        return this._info.seed;
    };

    getGeneratorType() {
        return this._info.generator;
    };

    getGeneratorOptions() {
        return this._info.generatorOptions;
    };

    generateChunk(x) {
        this.dirtyChunks.add(x);
        return this.generator.generate({}, x);
    };

    getChunk(x) {
        if (!this.chunks[x] && existsSync(this.path + "/chunks/" + x + ".json")) {
            const loaded = JSON.parse(readFileSync(this.path + "/chunks/" + x + ".json", "utf8"));
            for (const data of loaded.entities) {
                const clas = {
                    [EntityIds.ITEM]: S_ItemEntity,
                    [EntityIds.FALLING_BLOCK]: S_FallingBlockEntity,
                    [EntityIds.TNT]: S_TNTEntity,
                    [EntityIds.XP_ORB]: S_XPOrbEntity
                }[data.type];
                if (!clas) continue;
                const entity = clas.deserialize(this, data);
                this.addEntity(entity);
            }
            for (const data of loaded.tiles) {
                const clas = {
                    [TileIds.FURNACE]: FurnaceTile,
                    [TileIds.CHEST]: ChestTile
                }[data.type];
                if (!clas) continue;
                const tile = clas.deserialize(this, data);
                tile.init();
                tile.add();
            }
            return this.chunks[x] = loaded.subChunks;
        }
        return super.getChunk(x);
    };

    setBlock(worldX, worldY, id, meta = 0, updateAround = true, broadcast = true, except = null) {
        this.dirtyChunks.add(worldX >> 4);
        if (updateAround) {
            this.dirtyUpdateBlocks.add(worldX + " " + worldY);
        }
        if (broadcast) {
            this.broadcastBlockUpdate(worldX, worldY, id, meta, except);
        }
        return super.setBlock(worldX, worldY, id, meta);
    };

    onBlockUpdate(x, y) {
        for (const pos of SelfAround) {
            const X = x + pos[0];
            const Y = y + pos[1];
            const block = this.getBlock(X, Y);
            const updater = BlockUpdater[block[0]];
            if (updater) updater(this, X, Y, block);
        }
    };

    broadcastBlockUpdate(x, y, id, meta, except = null) {
        const pk = BlockUpdatePacket(x, y, id, meta);
        for (const player of this.getChunkPlayerViewers(x >> 4)) {
            if (player === except) continue;
            player.session.sendPacket(pk);
        }
    };

    addEntity(entity) {
        this.entityMap[entity.id] = entity;
        entity.broadcastEntity();
        entity.handleMovement();
    };

    getTile(worldX, worldY) {
        return (this.tiles[worldX] ?? {})[worldY];
    };

    setTile(worldX, worldY, tile) {
        const old = this.getTile(worldX, worldY);
        if (old) old.remove();
        if (tile) tile.add();
    };

    checkTile(worldX, worldY) {
        const id = this.getBlock(worldX, worldY)[0];
        const old = this.getTile(worldX, worldY);
        if (!(id in TileBlockIdMap)) {
            if (old) old.remove();
            return;
        }
        const tileType = TileBlockIdMap[id];
        const tileClass = {
            [TileIds.FURNACE]: FurnaceTile,
            [TileIds.CHEST]: ChestTile
        }[tileType];
        if (old && old.type === tileType) return;
        const tile = new tileClass(this, worldX, worldY);
        tile.init();
        this.setTile(worldX, worldY, tile);
    };

    /**
     * @param chunkX
     * @return {S_Entity[]}
     */
    getChunkViewers(chunkX) {
        const viewers = [];
        const chunkDistance = Server.getChunkDistance();
        for (let X = chunkX - chunkDistance; X <= chunkX + chunkDistance; X++) {
            for (const entity of (this.entityMap[X] ?? [])) {
                viewers.push(entity);
            }
        }
        return viewers;
    };

    /**
     * @param chunkX
     * @return {S_Player[]}
     */
    getChunkPlayerViewers(chunkX) {
        const viewers = [];
        const chunkDistance = Server.getChunkDistance();
        for (const player of Server.getPlayers()) {
            if (Math.floor(Math.abs((player.x >> 4) - chunkX)) < chunkDistance) {
                viewers.push(player);
            }
        }
        return viewers;
    };

    dropItem(x, y, item, holdDelay = 0.25, vx = (Math.random() - 0.5) * 5, vy = Math.random() * 3 + 2) {
        if (!item) return;
        const entity = new S_ItemEntity(this, new ObjectTag({
            item: new ItemTag(item),
            holdTimer: new Float32Tag(holdDelay),
            x: new Float32Tag(x),
            y: new Float32Tag(y),
            vx: new Float32Tag(vx),
            vy: new Float32Tag(vy)
        }));
        this.addEntity(entity);
        return entity;
    };

    dropXP(x, y, amount = 1, vx = (Math.random() - 0.5) * 5, vy = Math.random() * 3 + 2) {
        const entity = new S_XPOrbEntity(this, new ObjectTag({
            size: new Float32Tag(amount),
            x: new Float32Tag(x),
            y: new Float32Tag(y),
            vx: new Float32Tag(vx),
            vy: new Float32Tag(vy)
        }));
        this.addEntity(entity);
        return entity;
    };

    playSound(file, x, y) {
        for (const player of this.getChunkPlayerViewers(x >> 4)) {
            if (player instanceof S_Player) player.session.playSound(file, x, y);
        }
    };

    addParticle(id, x, y, extra = {}) {
        for (const player of this.getChunkPlayerViewers(x >> 4)) {
            if (player instanceof S_Player) player.session.sendParticle(id, x, y, extra);
        }
    };

    saveChunk(x) {
        const chunk = this.chunks[x];
        /*** @type {S_Entity[]} */
        const entities = this.chunkEntities[x] ?? [];
        const tiles = this.chunkTiles[x] ?? [];
        const data = {subChunks: [], entities: [], tiles: []};
        for (const y in chunk) {
            data.subChunks[y] = Array.from(chunk[y]);
        }
        for (const entity of entities) {
            if (entity.type === EntityIds.PLAYER) continue;
            entity.saveNBT();
            data.entities.push(entity.__private_nbt.value);
        }
        for (const tile of tiles) {
            data.tiles.push(tile.serialize());
        }
        writeFileSync(this.path + "/chunks/" + x + ".json", JSON.stringify(data));
    };

    save() {
        this.dirtyChunks.forEach(x => {
            this.saveChunk(x);
        });
        this.dirtyChunks.clear();
        writeFileSync(this.path + "/world.json", JSON.stringify(this._info));
    };

    update() {
        for (const b of this.dirtyUpdateBlocks) {
            const t = b.split(" ");
            this.onBlockUpdate(Number(t[0]), Number(t[1]));
        }
        this.dirtyUpdateBlocks.clear();
    };
}