import {Ids} from "../../../../client/common/metadata/Ids.js";
import {Generator} from "../Generator.js";
import {randInt} from "../../../../client/common/Utils.js";
import {DefaultGenerator} from "./DefaultGenerator.js";

function getPY(worldX, x) {
    const a = (worldX + x) / 10;
    return (
        Math.sin(4 * a + 5) +
        Math.sin(2 * a + 2)
    ) / 6 * 10 + 55;
}

export class FunnyGenerator extends Generator {
    generate(chunk, chunkX) {
        const worldX = chunkX * 16;
        for (let x = 0; x < 16; x++) {
            const pY = getPY(worldX, x);
            const hasTree = x >= 2 && x <= 13 && x % 3 === 0 && Math.round(pY) > 54;
            Generator.setBlock(chunk, x, pY, [
                Math.round(pY) <= 54 ? [Ids.SAND, Ids.GRAVEL][Math.round(Math.random())] : (hasTree ? Math.floor(Math.random() * Ids.ANVIL) : Math.floor(Math.random() * Ids.ANVIL)), 0
            ]);
            if (hasTree) {
                const treeSize = randInt(3, 5);
                for (let y = 0; y < treeSize; y++) Generator.setBlock(chunk, x, pY + y + 1, [Math.floor(Math.random() * Ids.ANVIL)]);
                DefaultGenerator.LEAVES.forEach(pos => Generator.setBlock(chunk, pos[0] + x, pos[1] + pY + treeSize + 1, [Math.floor(Math.random() * Ids.ANVIL)]));
            }
            for (let y = 1; y < Math.max(Math.round(pY), 55); y++) {
                if (Generator.getBlock(chunk, x, y)[0] !== Ids.AIR) continue;
                if (y < pY) {
                    let oreA = 0;
                    const types = [0];
                    if (y <= 32) types.push(1);
                    if (y <= 11) types.push(2);
                    const oreType = types[randInt(0, types.length - 1)]; // todo: use the seed instead
                    const oreId = [Ids.COAL_ORE, Ids.IRON_ORE, Ids.DIAMOND_ORE][oreType];

                    function ore(x, y) {
                        if (Generator.getBlock(chunk, x, y)[0] !== Ids.AIR || x > 15 || x < 0 || getPY(x) - y <= 3 || y <= 0) return false;
                        Generator.setBlock(chunk, x, y, [oreId, 0]);
                        [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(p => {
                            if (!oreA || Math.random() >= oreA / 5) ore(x + p[0], y + p[1], oreA++);
                        });
                        return true;
                    }

                    if (Math.random() >= 0.02 || !ore(x, y)) Generator.setBlock(chunk, x, y, [pY - y <= 3 ? (Math.round(pY) <= 54 ? [Ids.SAND, Ids.GRAVEL][Math.round(Math.random())] : Math.floor(Math.random() * Ids.ANVIL)) : Math.floor(Math.random() * Ids.ANVIL), 0]);
                } else {
                    Generator.setBlock(chunk, x, y, [Ids.WATER, 0]);
                }
            }
            Generator.setBlock(chunk, x, 0, [Ids.BEDROCK, 0]);
        }
        return chunk;
    };
}