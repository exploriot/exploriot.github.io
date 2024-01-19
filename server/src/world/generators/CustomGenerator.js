import {Generator} from "../Generator.js";

export class CustomGenerator extends Generator {
    constructor(world, pattern) {
        super(world);
        this.pattern = pattern.split(";").map((i, j) => {
            if (!i) return null;
            const v = i.split(",").map(parseInt);
            return [v[0], v[1] || 0, j];
        }).filter(Boolean);
    };

    generate(chunk, chunkX) {
        for (let x = 0; x < 16; x++) {
            for (const [id, meta, y] of this.pattern) {
                Generator.setBlock(chunk, x, y, [id, meta]);
            }
        }
        return chunk;
    };
}