import {getSubChunkIndex, makeSubChunk} from "../../../client/common/world/World.js";
import {generateSeed} from "../../../client/common/Utils.js";

export class Generator {
    /*** @param {S_World} world */
    constructor(world) {
        this.world = world;
        this.positiveGen = generateSeed(world.getSeed());
        this.negativeGen = generateSeed(world.getSeed());
    }

    getSpawnLocation() {
        return {x: 0, y: 0};
    };

    generate(chunk, chunkX) {
        return chunk;
    };

    static setBlock(chunk, x, y, info) {
        // x: [0, 255]
        // y: [0, 15]
        const subChunk = chunk[y >> 4] ??= makeSubChunk();
        const index = getSubChunkIndex(x, y & 0xf);
        subChunk.set(info, index);
    };

    static getBlock(chunk, x, y) {
        // x: [0, 255]
        // y: [0, 15]
        const subChunk = chunk[y >> 4] ??= makeSubChunk();
        const index = getSubChunkIndex(x, y & 0xf);
        return subChunk.slice(index, index + 2);
    };
}