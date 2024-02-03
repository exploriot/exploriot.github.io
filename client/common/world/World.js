import {Metadata} from "../metadata/Metadata.js";
import {Around} from "../Utils.js";
import {EntityIds} from "../metadata/Entities.js";
import {getBlockHardness, getBoundingBoxesOf, isBlockItem} from "../metadata/Blocks.js";
import {Item} from "../item/Item.js";

export const MAX_WORLD_HEIGHT = 256; // 0 to 255
export const CHUNK_SIZE = 16;
export const SUB_CHUNK_AMOUNT = MAX_WORLD_HEIGHT / CHUNK_SIZE;

export function getWorldSubChunkIndex(worldX, worldY) {
    const inX = worldX & 0xf;
    const inY = worldY & 0xf;
    return (inX + inY * CHUNK_SIZE) * 2;
}

export function getSubChunkIndex(x, y) {
    return (Math.round(x) + Math.round(y) * CHUNK_SIZE) * 2;
}

export function makeSubChunk() {
    return new Int8Array(16 * MAX_WORLD_HEIGHT * 2);
}

const EmptyGenerator = {
    generate(obj) {
        return obj;
    }
};

export class World {
    /*** @type {Record<string, Record<string, Int8Array>>} */
    chunks = {};
    /*** @type {Record<number, Set<Entity>>} */
    chunkEntities = {};
    entityMap = {};
    id = 0;
    generator = EmptyGenerator;

    constructor(id) {
        this.id = id;
    };

    /**
     * @param {number} chunkX
     * @return {Set<Entity | C_Entity | S_Entity>}
     */
    getChunkEntities(chunkX) {
        return this.chunkEntities[chunkX] ??= new Set;
    };

    isInWorld(x, y) {
        return y >= 0 && y < MAX_WORLD_HEIGHT;
    };

    generateChunk(x) {
        return {};
    };

    getChunk(x) {
        return this.chunks[x] ??= this.generateChunk(x);
    };

    loadChunk(x) {
        const chunk = this.getChunk(x);
        for (let y = 0; y < SUB_CHUNK_AMOUNT; y++) {
            if (y in chunk) continue;
            chunk[y] = makeSubChunk();
        }
        return chunk;
    };

    loadSubChunk(x, y) {
        const chunk = this.getChunk(x);
        return chunk[y] = makeSubChunk();
    };

    setBlock(worldX, worldY, id, meta) {
        if (worldY < 0 || worldY >= MAX_WORLD_HEIGHT) return;
        worldX = Math.round(worldX);
        worldY = Math.round(worldY);
        const chunk = this.getChunk(worldX >> 4);
        let subChunk = chunk[worldY >> 4];
        if (!subChunk) subChunk = this.loadSubChunk(worldX >> 4, worldY >> 4);
        const index = getWorldSubChunkIndex(worldX, worldY);
        subChunk[index] = id;
        subChunk[index + 1] = meta;
    };

    getBlock(worldX, worldY) {
        if (worldY < 0 || worldY >= MAX_WORLD_HEIGHT) return new Int8Array([0, 0]);
        worldX = Math.round(worldX);
        worldY = Math.round(worldY);
        const chunk = this.getChunk(worldX >> 4);
        let subChunk = chunk[worldY >> 4];
        if (!subChunk) subChunk = this.loadSubChunk(worldX >> 4, worldY >> 4);
        const index = getWorldSubChunkIndex(worldX, worldY);
        return subChunk.slice(index, index + 2);
    };

    getHighestYAt(worldX) {
        for (let y = MAX_WORLD_HEIGHT - 1; y >= 0; y--) {
            if (!Metadata.phaseable.includes(this.getBlock(worldX, y)[0])) return y + 1;
        }
        return 0;
    };

    /**
     * @param {BoundingBox} bb
     * @param {number} x
     * @param {number} y
     * @param {boolean} phaseable
     * @param {[number, number][] | null} filter
     * @return {{bb: (BoundingBox | BoundingBox[]), collisions: BoundingBox[], x: number, y: number} | null}
     */
    getBlockCollisionAt(bb, x, y, phaseable = false, filter = null) {
        const block = this.getBlock(x, y);
        if (
            (!phaseable && Metadata.phaseable.includes(block[0]))
            || (filter && !filter.some(i => block[0] === i[0] && (i[1] === -1 || block[1] === i[1])))
        ) return null;
        const bb2 = getBoundingBoxesOf(block[0], block[1]);
        const col = bb.getCollidingBoxesTranslated(bb2, x, y);
        if (col.length) return {x, y, bb: bb2, collisions: col};
    };

    /**
     * @param {BoundingBox} bb
     * @param {boolean} phaseable
     * @param {number} amount
     * @param {[number, number][] | null} filter
     * @return {{bb: (BoundingBox | BoundingBox[]), collisions: BoundingBox[], x: number, y: number}[]}
     */
    getCollidingBlocks(bb, phaseable = false, amount = 1, filter = null) {
        const left = Math.floor(bb.x1 - 0.5);
        const right = Math.ceil(bb.x2 + 0.5);
        const bottom = Math.floor(bb.y1 - 0.5);
        const top = Math.ceil(bb.y2 + 0.5);

        const collisions = [];

        for (let x = left; x <= right; x++) {
            for (let y = bottom; y <= top; y++) {
                const col = this.getBlockCollisionAt(bb, x, y, phaseable, filter);
                if (col) {
                    collisions.push(col);
                    if (collisions.length >= amount) return collisions;
                }
            }
        }

        return collisions;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    isBlockCovered(x, y) {
        for (const pos of Around) {
            const id = this.getBlock(x + pos[0], y + pos[1])[0];
            if (Metadata.transparent.includes(id)) {
                return false;
            }
        }
        return true;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    canPlaceAt(x, y) {
        for (const pos of Around) {
            const id = this.getBlock(x + pos[0], y + pos[1])[0];
            if (Metadata.canPlaceBlockOnIt.includes(id)) return true;
        }
        return false;
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Item | null} item
     * @param {Entity | null} entity
     * @return {boolean}
     */
    canInteractBlockAt(x, y, item, entity = null) {
        if (
            !this.isInWorld(x, y)
            || this.isBlockCovered(x, y)
            || (entity && (
                entity.getGamemode() === 3
                || !entity.canReachBlock(x, y)
            ))
        ) return false;
        const block = this.getBlock(x, y);
        if (Metadata.interactable.includes(block[0])) return true;
        if (!item) return false;
        const list = Metadata.canInteractWith[item.id] ?? [];
        return item && (list === true || list.includes(block[0])) && this.canPlaceAt(x, y);
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} id
     * @param {number} meta
     * @param {Entity | null} entity
     * @return {boolean}
     */
    canPlaceBlockAt(x, y, id, meta, entity = null) {
        if (
            entity && (
                entity.getGamemode() === 3
                || !entity.canReachBlock(x, y)
            )
        ) return false;
        let bb;
        let block;
        return isBlockItem(id)
            && this.isInWorld(x, y)
            && Metadata.replaceable.includes((block = this.getBlock(x, y))[0])
            && (block[0] !== id || block[1] !== meta)
            && Metadata.block.includes(id)
            && (
                Metadata.phaseable.includes(id)
                || !(bb = getBoundingBoxesOf(id, meta))
                || !Array.from(this.getChunkEntities(x >> 4)).some(
                    i => i.type !== EntityIds.ITEM && i.bb.isCollidingWithTranslated(bb, x, y)
                )
            )
            && this.canPlaceAt(x, y)
            && (
                Metadata.canStayOnPhaseables.includes(id)
                || !Metadata.phaseable.includes(this.getBlock(x, y - 1)[0])
            );
    };

    /**
     * @param {number} x
     * @param {number} y
     * @param {Item} item
     * @param {boolean} instant
     * @param {Entity | null} entity
     * @return {boolean}
     */
    canBreakBlockAt(x, y, item, instant, entity = null) {
        if (!this.isInWorld(x, y)
            || (entity && (
                entity.getGamemode() === 3
                || !entity.canReachBlock(x, y)
            ))
        ) return false;
        if (y > 0 && y < MAX_WORLD_HEIGHT - 1 && this.isBlockCovered(x, y)) return false;
        const existing = this.getBlock(x, y);
        if (Metadata.neverBreakable.includes(existing[0])) return false;
        return instant || getBlockHardness(existing[0], item ? item.id : 0, 0, 0) >= 0;
    };
}