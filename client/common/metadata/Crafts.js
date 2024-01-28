import {Ids} from "./Ids.js";
import {ItemDescriptor as ID} from "../item/Item.js";
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

export function initCrafts() {
    for (let meta = 0; meta <= 5; meta++) {
        registerCraft(
            [
                "0"
            ],
            [new ID(Ids.LOG, meta)],
            new ID(Ids.PLANKS, meta, 4)
        );
        registerCraft(
            [
                "000"
            ],
            [new ID(Ids.PLANKS, meta)],
            new ID(Ids.WOODEN_SLAB, meta, 6)
        );
        registerCraft(
            [
                "  0",
                " 00",
                "000"
            ],
            [new ID(Ids.PLANKS, meta)],
            new ID(Ids.WOODEN_STAIRS, meta, 4)
        );
    }

    registerCraft(
        [
            "0",
            "0"
        ],
        [new ID(Ids.PLANKS)],
        new ID(Ids.STICK, null, 4)
    );

    registerCraft(
        [
            "00",
            "00"
        ],
        [new ID(Ids.PLANKS)],
        new ID(Ids.CRAFTING_TABLE)
    );

    for (const o of [
        [Ids.PLANKS, Ids.WOODEN_SWORD],
        [Ids.COBBLESTONE, Ids.STONE_SWORD],
        [Ids.IRON_INGOT, Ids.IRON_SWORD],
        [Ids.GOLD_INGOT, Ids.GOLDEN_SWORD],
        [Ids.DIAMOND, Ids.DIAMOND_SWORD]
    ]) registerCraft(
        [
            "0",
            "0",
            "1"
        ],
        [new ID(o[0]), new ID(Ids.STICK)],
        new ID(o[1])
    );

    for (const o of [
        [Ids.PLANKS, Ids.WOODEN_AXE],
        [Ids.COBBLESTONE, Ids.STONE_AXE],
        [Ids.IRON_INGOT, Ids.IRON_AXE],
        [Ids.GOLD_INGOT, Ids.GOLDEN_AXE],
        [Ids.DIAMOND, Ids.DIAMOND_AXE]
    ]) registerCraft(
        [
            "00",
            "01",
            " 1"
        ],
        [new ID(o[0]), new ID(Ids.STICK)],
        new ID(o[1])
    );

    for (const o of [
        [Ids.PLANKS, Ids.WOODEN_PICKAXE],
        [Ids.COBBLESTONE, Ids.STONE_PICKAXE],
        [Ids.IRON_INGOT, Ids.IRON_PICKAXE],
        [Ids.GOLD_INGOT, Ids.GOLDEN_PICKAXE],
        [Ids.DIAMOND, Ids.DIAMOND_PICKAXE]
    ]) registerCraft(
        [
            "000",
            " 1",
            " 1"
        ],
        [new ID(o[0]), new ID(Ids.STICK)],
        new ID(o[1])
    );

    for (const o of [
        [Ids.PLANKS, Ids.WOODEN_SHOVEL],
        [Ids.COBBLESTONE, Ids.STONE_SHOVEL],
        [Ids.IRON_INGOT, Ids.IRON_SHOVEL],
        [Ids.GOLD_INGOT, Ids.GOLDEN_SHOVEL],
        [Ids.DIAMOND, Ids.DIAMOND_SHOVEL]
    ]) registerCraft(
        [
            "0",
            "1",
            "1"
        ],
        [new ID(o[0]), new ID(Ids.STICK)],
        new ID(o[1])
    );

    for (const o of [
        [Ids.PLANKS, Ids.WOODEN_HOE],
        [Ids.COBBLESTONE, Ids.STONE_HOE],
        [Ids.IRON_INGOT, Ids.IRON_HOE],
        [Ids.GOLD_INGOT, Ids.GOLDEN_HOE],
        [Ids.DIAMOND, Ids.DIAMOND_HOE]
    ]) registerCraft(
        [
            "00",
            " 1",
            " 1"
        ],
        [new ID(o[0]), new ID(Ids.STICK)],
        new ID(o[1])
    );

    for (const o of [
        [Ids.IRON_INGOT, Ids.IRON_HELMET],
        [Ids.GOLD_INGOT, Ids.GOLDEN_HELMET],
        [Ids.DIAMOND, Ids.DIAMOND_HELMET]
    ]) registerCraft(
        [
            "000",
            "0 0"
        ],
        [new ID(o[0])],
        new ID(o[1])
    );

    for (const o of [
        [Ids.IRON_INGOT, Ids.IRON_CHESTPLATE],
        [Ids.GOLD_INGOT, Ids.GOLDEN_CHESTPLATE],
        [Ids.DIAMOND, Ids.DIAMOND_CHESTPLATE]
    ]) registerCraft(
        [
            "0 0",
            "000",
            "000"
        ],
        [new ID(o[0])],
        new ID(o[1])
    );

    for (const o of [
        [Ids.IRON_INGOT, Ids.IRON_LEGGINGS],
        [Ids.GOLD_INGOT, Ids.GOLDEN_LEGGINGS],
        [Ids.DIAMOND, Ids.DIAMOND_LEGGINGS]
    ]) registerCraft(
        [
            "000",
            "0 0",
            "0 0"
        ],
        [new ID(o[0])],
        new ID(o[1])
    );

    for (const o of [
        [Ids.IRON_INGOT, Ids.IRON_BOOTS],
        [Ids.GOLD_INGOT, Ids.GOLDEN_BOOTS],
        [Ids.DIAMOND, Ids.DIAMOND_BOOTS]
    ]) registerCraft(
        [
            "0 0",
            "0 0"
        ],
        [new ID(o[0])],
        new ID(o[1])
    );

    registerCraft(
        [
            "000",
            "0 0",
            "000"
        ],
        [new ID(Ids.PLANKS)],
        new ID(Ids.CHEST)
    );

    registerCraft(
        [
            "000",
            "0 0",
            "000"
        ],
        [new ID(Ids.COBBLESTONE)],
        new ID(Ids.FURNACE)
    );

    registerCraft(
        [
            "000",
            "000",
            "000"
        ],
        [new ID(Ids.IRON_NUGGET)],
        new ID(Ids.IRON_INGOT)
    );

    registerCraft(
        [
            "000",
            "000",
            "000"
        ],
        [new ID(Ids.GOLDEN_NUGGET)],
        new ID(Ids.GOLD_INGOT)
    );

    for (const o of [
        [Ids.STONE, Ids.STONE_SLAB, Ids.STONE_STAIRS],
        [Ids.DIRT, Ids.DIRT_SLAB, Ids.DIRT_STAIRS],
        [Ids.COBBLESTONE, Ids.COBBLESTONE_SLAB, Ids.COBBLESTONE_STAIRS]
    ]) {
        registerCraft(
            [
                "000"
            ], [new ID(o[0])],
            new ID(o[1])
        );
        registerCraft(
            [
                "  0",
                " 00",
                "000"
            ], [new ID(o[0])],
            new ID(o[2])
        );
    }

    for (const o of [
        [Ids.COAL, Ids.COAL_BLOCK],
        [Ids.IRON_INGOT, Ids.IRON_BLOCK],
        [Ids.GOLD_INGOT, Ids.GOLD_BLOCK],
        [Ids.DIAMOND, Ids.DIAMOND_BLOCK]
    ]) registerCraft(
        [
            "000",
            "000",
            "000"
        ], [new ID(o[0])], new ID(o[1])
    );

    registerCraft(
        [
            "000",
            " 1 ",
            "111"
        ],
        [new ID(Ids.IRON_BLOCK), new ID(Ids.IRON_INGOT)],
        new ID(Ids.ANVIL)
    );
}