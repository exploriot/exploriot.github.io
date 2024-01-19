import {Ids} from "./Ids.js";
import {ItemDescriptor} from "../item/Item.js";
import {Metadata} from "./Metadata.js";

export function trimCraftingMap(map) {
    for (let i = 0; i < map.length - 1; i++) {
        if (map.some(i => i[0])) break;
        for (let j = 0; j < map.length; j++) {
            for (let k = 0; k < map.length - 1; k++) {
                map[j][k] = map[j][k + 1];
            }
            map[j][map.length - 1] = null;
        }
    }
    for (let i = 0; i < map.length - 1; i++) {
        if (map[0].some(Boolean)) break;
        for (let j = 0; j < map.length; j++) {
            for (let k = 0; k < map.length - 1; k++) {
                map[k][j] = map[k + 1][j];
            }
            map[map.length - 1][j] = null;
        }
    }
    return map;
}

export function registerCraft(recipe, ingredients, result) {
    recipe = trimCraftingMap(recipe.map(i => [...i].map(j => j === " " ? null : ingredients[j])));
    Metadata.crafts.push({
        recipe: recipe, result
    });
}

export function findCrafting(map) {
    trimCraftingMap(map);
    return Metadata.crafts.find(craft => {
        for (let i = 0; i < Math.max(map.length, craft.recipe.length); i++) {
            const ct = craft.recipe[i] ?? [];
            const mt = map[i] ?? [];
            for (let j = 0; j < Math.max(ct.length, mt.length); j++) {
                const c = ct[j] ?? null;
                const m = mt[j] ?? null;
                if (c === null) {
                    if (m !== null) return false;
                    continue;
                }
                if (!c.equalsItem(m)) return false;
            }
        }
        return true;
    });
}

for (let meta = 0; meta <= 5; meta++) registerCraft(
    [
        "0"
    ],
    [new ItemDescriptor(Ids.LOG, meta)],
    new ItemDescriptor(Ids.PLANKS, meta, 4)
);

registerCraft(
    [
        "0",
        "0"
    ],
    [new ItemDescriptor(Ids.PLANKS)],
    new ItemDescriptor(Ids.STICK, null, 4)
);

registerCraft(
    [
        "00",
        "00"
    ],
    [new ItemDescriptor(Ids.PLANKS)],
    new ItemDescriptor(Ids.CRAFTING_TABLE)
);

for (const o of [
    [Ids.PLANKS, Ids.WOODEN_SWORD],
    [Ids.COBBLESTONE, Ids.STONE_SWORD],
    [Ids.GOLD_INGOT, Ids.GOLDEN_SWORD]
]) registerCraft(
    [
        "0",
        "0",
        "1"
    ],
    [new ItemDescriptor(o[0]), new ItemDescriptor(Ids.STICK)],
    new ItemDescriptor(o[1])
);

for (const o of [
    [Ids.PLANKS, Ids.WOODEN_AXE],
    [Ids.COBBLESTONE, Ids.STONE_AXE],
    [Ids.GOLD_INGOT, Ids.GOLDEN_AXE]
]) registerCraft(
    [
        "00",
        "01",
        " 1"
    ],
    [new ItemDescriptor(o[0]), new ItemDescriptor(Ids.STICK)],
    new ItemDescriptor(o[1])
);

for (const o of [
    [Ids.PLANKS, Ids.WOODEN_PICKAXE],
    [Ids.COBBLESTONE, Ids.STONE_PICKAXE],
    [Ids.GOLD_INGOT, Ids.GOLDEN_PICKAXE]
]) registerCraft(
    [
        "000",
        " 1",
        " 1"
    ],
    [new ItemDescriptor(o[0]), new ItemDescriptor(Ids.STICK)],
    new ItemDescriptor(o[1])
);

for (const o of [
    [Ids.PLANKS, Ids.WOODEN_SHOVEL],
    [Ids.COBBLESTONE, Ids.STONE_SHOVEL],
    [Ids.GOLD_INGOT, Ids.GOLDEN_SHOVEL]
]) registerCraft(
    [
        "0",
        "1",
        "1"
    ],
    [new ItemDescriptor(o[0]), new ItemDescriptor(Ids.STICK)],
    new ItemDescriptor(o[1])
);

for (const o of [
    [Ids.PLANKS, Ids.WOODEN_HOE],
    [Ids.COBBLESTONE, Ids.STONE_HOE],
    [Ids.GOLD_INGOT, Ids.GOLDEN_HOE]
]) registerCraft(
    [
        "00",
        " 1",
        " 1"
    ],
    [new ItemDescriptor(o[0]), new ItemDescriptor(Ids.STICK)],
    new ItemDescriptor(o[1])
);