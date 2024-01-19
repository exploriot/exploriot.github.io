import {Generator} from "../Generator.js";
import {Ids} from "../../../../client/common/metadata/Ids.js";
import {DefaultGenerator} from "./DefaultGenerator.js";

export class SkyBlockGenerator extends Generator {
    generate(chunk, chunkX) {
        if (chunkX !== 0) return chunk;
        for (let x = 0; x <= 7; x++) Generator.setBlock(chunk, x, 100, [Ids.GRASS_BLOCK, 0]);
        for (let x = 0; x <= 7; x++) for (let y = 97; y <= 99; y++) Generator.setBlock(chunk, x, y, [Ids.DIRT, 0]);
        Generator.setBlock(chunk, 1, 101, [Ids.CHEST, 0]);
        for (let y = 101; y <= 104; y++) Generator.setBlock(chunk, 5, y, [Ids.LOG, 0]);
        for (const p of DefaultGenerator.LEAVES) Generator.setBlock(chunk, 5 + p[0], 104 + p[1], [Ids.LEAVES, 0]);
        return chunk;
    };
}