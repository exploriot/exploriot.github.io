import {makeSubChunk, World} from "../../../client/common/world/World.js";
import {Around, randInt} from "../../../client/common/Utils.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {BlockUpdatePacket} from "../packet/BlockUpdatePacket.js";
import {S_FallingBlockEntity} from "../entity/FallingBlockEntity.js";
import {S_ItemEntity} from "../entity/ItemEntity.js";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import {EntityIds, getEntityByName} from "../../../client/common/metadata/Entities.js";
import {Generators} from "./GeneratorManager.js";
import {FlowerIds, getBlockDigSound, getBlockDrops, getBlockMetaMod} from "../../../client/common/metadata/Blocks.js";
import {TileBlockIdMap, TileIds} from "../tile/Tile.js";
import {FurnaceTile} from "../tile/FurnaceTile.js";
import {ChestTile} from "../tile/ChestTile.js";
import {S_XPOrbEntity} from "../entity/XPOrbEntity.js";
import {GameRules} from "../../../client/common/metadata/GameRules.js";
import {S_Player} from "../entity/Player.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Int8Tag} from "../../../client/common/compound/int/Int8Tag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {ItemTag} from "../../../client/common/compound/ItemTag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import {UInt32Tag} from "../../../client/common/compound/int/UInt32Tag.js";
import {BoolTag} from "../../../client/common/compound/BoolTag.js";
import {Tag} from "../../../client/common/compound/Tag.js";
import {ListTag} from "../../../client/common/compound/ListTag.js";
import {SpawnerTile} from "../tile/SpawnerTile.js";
import {S_TNTEntity} from "../entity/TNTEntity.js";
import {S_ZombieEntity} from "../entity/ZombieEntity.js";
import {EntityAnimationPacket} from "../packet/EntityAnimationPacket.js";
import {AnimationIds} from "../../../client/common/metadata/AnimationIds.js";
import {Item} from "../../../client/common/item/Item.js";
import {ParticleIds} from "../../../client/common/metadata/ParticleIds.js";
import {ContainerIds, Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {OpenContainerPacket} from "../packet/OpenContainerPacket.js";

export const ENTITY_MAP = {
    [EntityIds.ITEM]: S_ItemEntity,
    [EntityIds.FALLING_BLOCK]: S_FallingBlockEntity,
    [EntityIds.TNT]: S_TNTEntity,
    [EntityIds.XP_ORB]: S_XPOrbEntity,
    [EntityIds.ZOMBIE]: S_ZombieEntity
};

const INTERACTION_RESPONSE = {
    FAIL: 0,
    SUCCESS: 1,
    DECREASE: 2,
    DAMAGE: 3
};

const BlockUpdaterTime = {
    [Ids.WATER]: 0.2,
    [Ids.LAVA]: 0.2
};

/*** @type {{[key: number]: function(world: S_World, x: number, y: number, self: [number, number]): void}} */
const BlockUpdater = {
    [Ids.SAND](world, x, y, self) {
        const down = world.getBlock(x, y - 1);
        if (!Metadata.phaseable.includes(down[0])) return;
        world.setBlock(x, y, Ids.AIR);
        const sand = new S_FallingBlockEntity(world, new ObjectTag({
            blockId: new Int8Tag(self[0]),
            blockMeta: new Int8Tag(self[1])
        }));
        sand.x = x;
        sand.y = y;
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
                world.breakBlockAt(X, Y - 1);
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
                    if (b[0] !== Ids.AIR) world.breakBlockAt(X + dx, Y);
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
    },
    [Ids.CHEST](world, x, y, self) {
        const left = world.getBlock(x - 1, y);
        const right = world.getBlock(x + 1, y);
        const opt = {updateSelf: false, updateAround: false};
        if (self[1] === 0) {
            if (left[0] === Ids.CHEST && left[1] === 0) {
                world.setBlock(x, y, Ids.CHEST, 2, opt);
                world.setBlock(x - 1, y, Ids.CHEST, 1, opt);
                return;
            }
            if (right[0] === Ids.CHEST && right[1] === 0) {
                world.setBlock(x, y, Ids.CHEST, 1, opt);
                world.setBlock(x + 1, y, Ids.CHEST, 2, opt);
            }
        } else if (self[1] === 1) {
            if (right[0] !== Ids.CHEST || right[1] !== 2) {
                world.setBlock(x, y, Ids.CHEST, 0, opt);
            }
        } else if (self[1] === 2) {
            if (left[0] !== Ids.CHEST || left[1] !== 1) {
                world.setBlock(x, y, Ids.CHEST, 0, opt);
            }
        }
    }
};

BlockUpdater[Ids.GRAVEL] = BlockUpdater[Ids.ANVIL] = BlockUpdater[Ids.SAND];

const BlockInteractMap = {
    [Ids.CRAFTING_TABLE](world, x, y, entity) {
        if (!entity || !(entity instanceof S_Player) || entity.externalInventory) return INTERACTION_RESPONSE.FAIL;
        const ext = entity.externalInventory = new Inventory(10, InventoryIds.EXTERNAL, {
            containerId: ContainerIds.CRAFTING_TABLE, x, y
        });
        entity.session.sendPacket(OpenContainerPacket({
            containerId: ext.extra.containerId, x, y
        }));
        return INTERACTION_RESPONSE.SUCCESS;
    },
    [Ids.FURNACE](world, x, y, entity, _, block) {
        if (!entity || !(entity instanceof S_Player) || entity.externalInventory) return INTERACTION_RESPONSE.FAIL;
        world.checkTile(x, y);
        const tile = world.getTile(x, y);
        if (!tile) return INTERACTION_RESPONSE.FAIL;
        if (block[0] === Ids.CHEST) tile.updateDouble(block[1]);
        entity.externalInventory = tile.getClientContainer();
        tile.viewers.add(entity);

        const network = entity.session;
        network.subscribedTiles.add(tile);
        network.sendPacket(OpenContainerPacket(tile.getClientExtra()));
        network.sendContainerState(tile.getClientState());
        network.sendInventory(entity.externalInventory);
        return INTERACTION_RESPONSE.SUCCESS;
    },
    [Ids.TNT](world, x, y, entity, item) {
        if (!item || item.id !== Ids.FLINT_AND_STEEL) return INTERACTION_RESPONSE.FAIL;
        world.setBlock(x, y, Ids.AIR);
        const tnt = new S_TNTEntity(world);
        tnt.x = x;
        tnt.y = y;
        tnt.parentEntityUUID = entity ? entity.uuid : null;
        world.addEntity(tnt);
        return INTERACTION_RESPONSE.DAMAGE;
    },
    [Ids.ENTITY_SPAWNER](world, x, y, entity, item, self) {
        if (!item || item.id !== Ids.SPAWN_EGG) return INTERACTION_RESPONSE.FAIL;
        const ch = world.getTile(x, y);
        if (ch) return INTERACTION_RESPONSE.FAIL;
        const tile = new SpawnerTile(world, new ObjectTag({
            x: new Float32Tag(x),
            y: new Float32Tag(y),
            entityName: new StringTag(item.nbt.entityName),
            entityType: new Int8Tag(item.nbt.entityType),
            entityNBT: new StringTag(JSON.stringify(item.nbt.entityNBT))
        }));
        if (tile.init(self)) world.setTile(x, y, tile);
        return INTERACTION_RESPONSE.DECREASE;
    }
};
BlockInteractMap[Ids.CHEST] = BlockInteractMap[Ids.FURNACE];

const ItemInteractMap = {
    [Ids.SPAWN_EGG](world, x, y, entity, item) {
        if (!world.summonEntity(
            item.nbt.entityName ? getEntityByName(item.nbt.entityName) : item.nbt.entityType,
            x, y,
            item.nbt.entityNBT || {}
        )) return INTERACTION_RESPONSE.FAIL;
        return INTERACTION_RESPONSE.DECREASE;
    },
    [Ids.FLINT_AND_STEEL](world, x, y, entity) {
        const block = world.getBlock(x, y);
        if (block[0] !== Ids.AIR || Metadata.phaseable.includes(world.getBlock(x, y - 1))) {
            return INTERACTION_RESPONSE.FAIL;
        }
        world.placeBlockAt(x, y, new Item(Ids.FIRE), {
            entity, sound: false
        });
        world.playSound("assets/sounds/random/ignite.ogg", x, y);
        return INTERACTION_RESPONSE.DAMAGE;
    }
};

export function generateSeed() {
    return randInt(0, 9999999999999);
}

/**
 * @property {string} generatorName
 * @property {string} generatorOptions
 * @property {number} seed
 * @property {Record<number, boolean>} gameRules
 * @property {number} time
 */
export class S_World extends World {
    static NBT_STRUCTURE = new ObjectTag({
        generatorName: new StringTag("default"),
        generatorOptions: new StringTag(""),
        seed: new UInt32Tag(generateSeed()),
        gameRules: new ObjectTag({
            [GameRules.TNT_EXPLODES]: new BoolTag(true),
            [GameRules.FALL_DAMAGE]: new BoolTag(true),
            [GameRules.NATURAL_REGENERATION]: new BoolTag(true),
            [GameRules.STARVE_DAMAGE]: new BoolTag(true),
            [GameRules.DROWNING_DAMAGE]: new BoolTag(true)
        }),
        time: new Float32Tag(0)
    });

    dirtyChunks = new Set;
    data = {};
    dirtyUpdateBlocks = {};

    // worldX, worldY
    /*** @type {Record<number, Set<S_Entity>>} */
    chunkEntities = {};

    // worldX, worldY
    /*** @type {Record<number, Record<number, Tile>>} */
    tiles = {};

    // chunkX
    /*** @type {Record<number, Set<Tile>>} */
    chunkTiles = {};

    /**
     * @param {number} id
     * @param {string} name
     * @param {ObjectTag} init
     */
    constructor(id, name, init = new ObjectTag) {
        super(id);
        this.name = name;
        this.path = "./worlds/" + name;
        this.validatePath();
        /*** @type {ObjectTag} */
        this.nbt = existsSync("./worlds/" + this.name + "/world.nbt")
            ? Tag.readAny(readFileSync("./worlds/" + this.name + "/world.nbt"), 0)[1]
            : this.constructor.NBT_STRUCTURE.clone();
        this.nbt.combine(init);
        this.nbt.applyTo(this);
        this.generator = new (Generators[this.generatorName])(this, this.generatorOptions);
    };

    setTime(v) {
        super.setTime(v);
        this.broadcastTime();
    };

    broadcastTime() {
        for (const player of Server.getPlayers()) {
            if (player.world !== this) continue;
            player.session.sendTime();
        }
    };

    /**
     * @param {number} chunkX
     * @return {Set<Tile>}
     */
    getChunkTiles(chunkX) {
        return this.chunkTiles[chunkX] ??= new Set;
    };

    validatePath() {
        if (!existsSync("./worlds")) mkdirSync("./worlds");
        if (!existsSync("./worlds/" + this.name)) mkdirSync(this.path);
        if (!existsSync("./worlds/" + this.name + "/chunks")) mkdirSync(this.path + "/chunks");
    };

    getGameRule(id) {
        return this.gameRules[id];
    };

    setGameRule(id, value) {
        this.gameRules[id] = value;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {S_Entity | null} entity
     * @param {Item} item
     * @param {Inventory | null} inventory
     * @param {number} index
     * @param {boolean} dropItems
     * @param {boolean} damageItem
     * @param {boolean} sound
     * @param {boolean} particle
     * @return {boolean}
     */
    breakBlockAt(x, y, {
        entity = null,
        item = null,
        inventory = null,
        index = 0,
        dropItems = true,
        damageItem = true,
        sound = true,
        particle = true
    } = {}) {
        if (!this.canBreakBlockAt(x, y, item, entity.isCreative(), entity)) return false;
        if (entity) {
            entity.broadcastPacketToViewers(EntityAnimationPacket(entity.id, AnimationIds.HAND_SWING));
        }
        const block = this.getBlock(x, y);
        if (block[0] === Ids.AIR) return false;
        if (dropItems) this.summonBlockDrops(x, y, item);
        if (sound) {
            const id = this.getBlock(x, y)[0];
            const sound = getBlockDigSound(id);
            if (sound) this.playSound(sound, x, y);
        }
        if (damageItem && inventory && (item.id in Metadata.toolLevelItems) && Metadata.hardness[block[0]] !== 0) {
            inventory.damageItemAt(index, 1, entity && this, entity && entity.x, entity && entity.y);
        }
        if (particle) {
            this.addParticle(ParticleIds.BLOCK_BREAK, x, y, {id: block[0], meta: block[1]});
        }
        this.setBlock(x, y, Ids.AIR);
        this.checkTile(x, y);
        return true;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Item} item
     * @param {Inventory | null} inventory
     * @param {number} index
     * @param {number} rotation
     * @param {S_Entity | null} entity
     * @param {boolean} sound
     * @return {boolean}
     */
    placeBlockAt(x, y, item, {
        inventory = null,
        index = 0,
        rotation = 0,
        entity = null,
        sound = true
    } = {}) {
        if (!item || !this.canPlaceBlockAt(x, y, item.id, item.meta, entity)) return false;
        if (entity) {
            entity.broadcastPacketToViewers(EntityAnimationPacket(entity.id, AnimationIds.HAND_SWING));
            if (!entity.isCreative() && inventory) inventory.decreaseItemAt(index);
        }
        if (sound) {
            const sound = getBlockDigSound(item.id);
            if (sound) this.playSound(sound, x, y);
        }
        let meta = item.meta;
        if (Metadata.slab.includes(item.id) || Metadata.stairs.includes(item.id)) {
            meta += (rotation % 4) * getBlockMetaMod(id);
        }
        this.setBlock(x, y, item.id, meta);
        this.checkTile(x, y);
        return true;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Item} item
     * @param {S_Entity | null} entity
     * @param {boolean} damageItem
     * @param {Inventory | null} inventory
     * @param {number} index
     * @return {boolean}
     */
    interactBlockAt(x, y, item, {
        entity = null,
        affectItem = true,
        inventory = null,
        index = 0
    } = {}) {
        if (!this.canInteractBlockAt(x, y, item, entity)) return false;
        if (entity) {
            entity.broadcastPacketToViewers(EntityAnimationPacket(entity.id, AnimationIds.HAND_SWING));
        }
        const block = this.getBlock(x, y);
        const interaction = BlockInteractMap[block[0]] ?? ItemInteractMap[item.id];
        if (!interaction) return false;
        const response = interaction(this, x, y, entity, item, block);
        if (response === INTERACTION_RESPONSE.FAIL) return false;

        if (affectItem && inventory) {
            if (response === INTERACTION_RESPONSE.DAMAGE) {
                inventory.damageItemAt(index, 1, entity && this, entity && entity.x, entity && entity.y);
            } else if (response === INTERACTION_RESPONSE.DECREASE) inventory.decreaseItemAt(index);
        }

        return true;
    };

    summonBlockDrops(x, y, breakItem = null) {
        const block = this.getBlock(x, y);
        const drops = getBlockDrops(block[0], block[1], breakItem);
        if (block[0] === Ids.CHEST && block[1] === 2) {

        }
        for (const item of drops) {
            this.dropItem(x, y, item);
        }
    };

    getSpawnLocation() {
        return this.generator.getSpawnLocation();
    };

    getSafeSpawnLocation() {
        const loc = this.getSpawnLocation();
        return {x: loc.x, y: this.getHighestYAt(loc.x)};
    };

    getSeed() {
        return this.seed;
    };

    generateChunk(x) {
        this.dirtyChunks.add(x);
        return this.generator.generate({}, x);
    };

    getChunk(x) {
        if (!this.chunks[x] && existsSync("./worlds/" + this.name + "/chunks/" + x + ".nbt")) {
            /*** @type {ObjectTag} */
            const chunkNbt = Tag.readAny(readFileSync("./worlds/" + this.name + "/chunks/" + x + ".nbt"), 0)[1];
            /*** @type {ObjectTag} */
            const subChunksNbt = chunkNbt.getTag("subChunks");
            /*** @type {ListTag} */
            const entitiesNbt = chunkNbt.getTag("entities");
            /*** @type {ListTag} */
            const tilesNbt = chunkNbt.getTag("tiles");
            for (const nbt of entitiesNbt.tags) {
                this.summonEntity(nbt.getTagValue("type"), nbt.tags.x.value, nbt.tags.y.value, nbt);
            }
            const subChunks = subChunksNbt.tags;
            const chunk = this.chunks[x] = {};
            for (const y in subChunks) {
                const subChunk = chunk[y] = makeSubChunk();
                subChunk.set(subChunks[y].value.split("").map(i => i.charCodeAt(0)), 0);
            }
            for (const nbt of tilesNbt.tags) {
                const clas = {
                    [TileIds.FURNACE]: FurnaceTile,
                    [TileIds.CHEST]: ChestTile,
                    [TileIds.SPAWNER]: SpawnerTile
                }[nbt.getTagValue("type")];
                if (!clas) continue;
                const tile = new clas(this, nbt);
                if (tile.init(super.getBlock(tile.x, tile.y))) {
                    this.setTile(tile.x, tile.y, tile);
                }
            }
            return chunk;
        }
        return super.getChunk(x);
    };

    setBlock(worldX, worldY, id, meta = 0, {
        updateSelf = true,
        updateAround = true,
        broadcast = true,
        except = null
    } = {}) {
        this.dirtyChunks.add(worldX >> 4);
        super.setBlock(worldX, worldY, id, meta);
        if (updateAround) {
            this.updateBlocksAround(worldX, worldY);
        }
        if (updateSelf) {
            if (this.scheduleBlockUpdateAt(worldX, worldY)) {
                const b = this.getBlock(worldX, worldY);
                id = b[0];
                meta = b[1];
            }
        }
        if (broadcast) {
            this.broadcastBlockUpdate(worldX, worldY, id, meta, except);
        }
    };

    updateBlocksAround(x, y) {
        for (const pos of Around) {
            const X = x + pos[0];
            const Y = y + pos[1];
            this.scheduleBlockUpdateAt(X, Y);
        }
    };

    scheduleBlockUpdateAt(x, y) {
        const block = this.getBlock(x, y);
        if (block[0] === Ids.CHEST) {
            this.onBlockUpdate(x, y);
            return true;
        }
        this.dirtyUpdateBlocks[x + " " + y] = BlockUpdaterTime[block[0]] ?? 0;
        return false;
    };

    onBlockUpdate(x, y) {
        const block = this.getBlock(x, y);
        if (!Metadata.canStayOnPhaseables.includes(block[0])) {
            const down = this.getBlock(x, y - 1);
            if (Metadata.phaseable.includes(down[0])) {
                this.setBlock(x, y, Ids.AIR);
                return;
            }
        }
        const updater = BlockUpdater[block[0]];
        if (updater) updater(this, x, y, block);
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
        this.dirtyChunks.add(entity.x >> 4);
    };

    getTile(worldX, worldY) {
        return (this.tiles[worldX] ?? {})[worldY];
    };

    removeTile(worldX, worldY) {
        const old = this.getTile(worldX, worldY);
        if (old) old.remove();
    };

    setTile(worldX, worldY, tile) {
        const old = this.getTile(worldX, worldY);
        if (old) old.remove();

        const holder = this.tiles[worldX] ??= {};
        if (tile) {
            holder[worldY] = tile;
            this.getChunkTiles(worldX >> 4).add(tile);
        } else delete holder[worldY];
    };

    checkTile(worldX, worldY, nbt = {}) {
        const block = this.getBlock(worldX, worldY);
        const old = this.getTile(worldX, worldY);
        if (!(block[0] in TileBlockIdMap)) {
            if (old) old.remove();
            return;
        }
        const tileType = TileBlockIdMap[block[0]];
        const clas = {
            [TileIds.FURNACE]: FurnaceTile,
            [TileIds.CHEST]: ChestTile,
            [TileIds.SPAWNER]: SpawnerTile
        }[tileType];
        if (old && old.type === tileType) {
            /*if (clas === ChestTile) {
                if (block[1] === 2) {
                    console.log(2)
                    this.checkTile(worldX - 1, worldY);
                } else if (old.isDouble && block[1] === 0) {
                    console.log(5)
                    for (let i = 27; i < 54; i++) {
                        this.dropItem(worldX, worldY, old.container.contents[i]);
                        old.container.contents[i] = null;
                    }
                    old.container.size = 27;
                    old.container.contents.length = 27;
                } else if (!old.isDouble && block[1] === 1) {
                    console.log(6)
                    const right = this.getTile(worldX + 1, worldY);
                    old.isDouble = true;
                    old.container.size = 54;
                    old.container.contents.length = 54;
                    if (right) {
                        for (let i = 27; i < 54; i++) {
                            old.container.get(i) = right.container.get(i - 27);
                        }
                        right.container.clear();
                        right.remove();
                    }
                }
            }*/
            return;
        }
        //if (clas === ChestTile && block[1] === 2) return;
        const tile = new clas(this, clas.NBT_STRUCTURE.clone().applyThis(nbt).applyThis({x: worldX, y: worldY}));
        if (tile.init(block)) this.setTile(worldX, worldY, tile);
    };

    /**
     * @param chunkX
     * @return {S_Entity[]}
     */
    getChunkViewers(chunkX) {
        const viewers = [];
        const chunkDistance = Server.getChunkDistance();
        for (let X = chunkX - chunkDistance; X <= chunkX + chunkDistance; X++) {
            for (const entity of this.getChunkEntities(X)) {
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

    dropItem(x, y, item, holdDelay = 0.25, vx = (Math.random() - 0.5) * 3, vy = Math.random() * 3 + 2) {
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

    playSound(file, x, y, volume = 0.3) {
        for (const player of this.getChunkPlayerViewers(x >> 4)) {
            if (player instanceof S_Player) player.session.playSound(file, x, y, volume);
        }
    };

    addParticle(id, x, y, extra = null) {
        for (const player of this.getChunkPlayerViewers(x >> 4)) {
            if (player instanceof S_Player) player.session.sendParticle(id, x, y, extra);
        }
    };

    /**
     * @param {number} id
     * @param {number} x
     * @param {number} y
     * @param {Object | ObjectTag} nbt
     * @return {S_Entity | null}
     */
    summonEntity(id, x, y, nbt = {}) {
        const clas = ENTITY_MAP[id];
        if (!clas) return null;
        const entity = new clas(this, nbt instanceof ObjectTag ? nbt : clas.NBT_PRIVATE_STRUCTURE.clone().applyThis(nbt));
        entity.x = x;
        entity.y = y;
        this.addEntity(entity);
        return entity;
    };

    saveChunk(x) {
        const chunk = this.chunks[x];
        /*** @type {Set<S_Entity>} */
        const entities = this.getChunkEntities(x);
        const tiles = this.chunkTiles[x] ?? [];

        const subChunksNbt = new ObjectTag;
        const entitiesNbt = new ListTag;
        const tilesNbt = new ListTag;

        const chunkNbt = new ObjectTag({
            subChunks: subChunksNbt,
            entities: entitiesNbt,
            tiles: tilesNbt
        });

        for (const y in chunk) subChunksNbt.setTag(y, new StringTag(
            Array.from(chunk[y])
                .map(i => String.fromCharCode(i))
                .join("")
        ));

        for (const entity of entities) {
            if (entity.type === EntityIds.PLAYER) continue;
            entity.saveNBT();
            entitiesNbt.push(entity.nbt);
        }

        for (const tile of tiles) {
            tile.saveNBT();
            tilesNbt.push(tile.nbt);
        }

        this.validatePath();
        writeFileSync("./worlds/" + this.name + "/chunks/" + x + ".nbt", chunkNbt.toBuffer());
    };

    save() {
        this.validatePath();
        this.dirtyChunks.forEach(x => {
            this.saveChunk(x);
        });
        this.dirtyChunks.clear();
        this.saveNBT();
        writeFileSync("./worlds/" + this.name + "/world.nbt", this.nbt.toBuffer());
    };

    saveNBT() {
        this.nbt.apply(this);
    };

    update(dt) {
        this.time += dt;
        const keys = Object.keys(this.dirtyUpdateBlocks);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if ((this.dirtyUpdateBlocks[k] -= dt) > 0) continue;
            delete this.dirtyUpdateBlocks[k];
            const key = k.split(" ");
            this.onBlockUpdate(key[0] * 1, key[1] * 1);
        }
    };
}