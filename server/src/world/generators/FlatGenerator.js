import {Ids} from "../../../../client/common/metadata/Ids.js";
import {Generator} from "../Generator.js";

export class FlatGenerator extends Generator {
    generate(chunk, chunkX) {
        for (let x = 0; x < 16; x++) {
            Generator.setBlock(chunk, x, 0, [Ids.BEDROCK, 0]);
            Generator.setBlock(chunk, x, 1, [Ids.DIRT, 0]);
            Generator.setBlock(chunk, x, 2, [Ids.DIRT, 0]);
            Generator.setBlock(chunk, x, 3, [Ids.GRASS_BLOCK, 0]);
        }
        return chunk;
    };
}