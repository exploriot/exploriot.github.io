import {Metadata} from "../metadata/Metadata.js";
import {Around} from "../Utils.js";
import {EntityIds} from "../metadata/Entities.js";
import {getBlockHardness, getBoundingBoxesOf} from "../metadata/Blocks.js";
import {Ids} from "../metadata/Ids.js";

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
    /*** @type {Record<number, Entity[]>} */
    chunkEntities = {};
    entityMap = {};
    id = 0;
    generator = EmptyGenerator;

    constructor(id) {
        this.id = id;
    };

    /**
     * @param {number} chunkX
     * @return {Entity[]}
     */
    getChunkEntities(chunkX) {
        return this.chunkEntities[chunkX];
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

    getBlockCollisionAt(x, y) {
        const block = this.getBlock(x, y);
        if (Metadata.phaseable.includes(block[0])) return null;
        return getBoundingBoxesOf(block[0], block[1]);
    };

    getCollidingBlock(bb) {
        const left = Math.floor(bb.x1 - 0.5);
        const right = Math.ceil(bb.x2 + 0.5);
        const bottom = Math.floor(bb.y1 - 0.5);
        const top = Math.ceil(bb.y2 + 0.5);

        for (let x = left; x <= right; x++) {
            for (let y = bottom; y <= top; y++) {
                const bb2 = this.getBlockCollisionAt(x, y);
                if (!bb2) continue;
                const col = bb.getCollidingBoxesTranslated(bb2, x, y);
                if (col.length) return {x, y, bb: bb2, collisions: col};
            }
        }
        return null;
    };

    isBlockCovered(x, y) {
        for (const pos of Around) {
            const id = this.getBlock(x + pos[0], y + pos[1])[0];
            if (Metadata.transparent.includes(id)) {
                return false;
            }
        }
        return true;
    };

    canInteractBlockAt(player, x, y, mode = player.getGamemode(), item = player.getHandItem()) {
        if (
            mode === 3
            || !this.isInWorld(x, y)
            || !player.canReachBlock(x, y)
            || this.isBlockCovered(x, y)
        ) return false;
        const id = player.world.getBlock(x, y)[0];
        return Metadata.interactable.includes(id) && (id !== Ids.TNT || (item && item.id === Ids.FLINT_AND_STEEL));
    };

    canPlaceBlockAt(player, x, y, mode = player.getGamemode(), item = player.getHandItem()) {
        const chunkEntities = this.chunkEntities[x >> 4];
        let bb2;
        if (
            mode > 1
            || !this.isInWorld(x, y)
            || !player.canReachBlock(x, y)
            || !Metadata.replaceable.includes(this.getBlock(x, y)[0])
            || !item
            || !Metadata.block.includes(item.id)
            || (
                !Metadata.phaseable.includes(item.id)
                && (bb2 = getBoundingBoxesOf(item.id, item.meta))
                && (
                    player.bb.isCollidingWithTranslated(bb2, x, y) || (
                        chunkEntities
                        && chunkEntities.some(i => i.type !== EntityIds.ITEM && i.bb.isCollidingWithTranslated(bb2, x, y))
                    )
                )
            )
        )
            return false;
        let canPlaceOnAny = false;
        for (const pos of Around) {
            const id = this.getBlock(x + pos[0], y + pos[1])[0];
            if (Metadata.canPlaceBlockOnIt.includes(id)) {
                canPlaceOnAny = true;
                break;
            }
        }
        return canPlaceOnAny;
    };

    canBreakBlockAt(player, x, y, mode = player.getGamemode(), handItem = player.getHandItem()) {
        if (
            mode > 1
            || !this.isInWorld(x, y)
            || !player.canReachBlock(x, y)
        ) return false;
        if (y > 0 && y < MAX_WORLD_HEIGHT - 1 && this.isBlockCovered(x, y)) return false;
        const existing = this.getBlock(x, y);
        if (Metadata.neverBreakable.includes(existing[0])) return false;
        return mode === 1 || getBlockHardness(existing[0], handItem ? handItem.id : 0, 0, 0);
    };
}