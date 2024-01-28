import {ARMOR_LEVEL, ARMOR_TYPES, Metadata, TOOL_LEVEL, TOOL_TYPES} from "./Metadata.js";
import {Ids} from "./Ids.js";
import {ItemDescriptor as ID} from "../item/Item.js";

export const ItemTextures = {};

export function getItemMaxStack(id) {
    return Metadata.maxStack[id] ?? 64;
}

if (typeof window === "undefined") global._getItemMaxStack = getItemMaxStack;
else window._getItemMaxStack = getItemMaxStack;

export function getItemName(id, meta) {
    let name = Metadata.itemName[id];
    if (!name) {
        name = Object.keys(Ids).find(i => Ids[i] === id);
        if (!name) return "Unknown";
        return name.split("_").map(i => i[0] + i.slice(1).toLowerCase()).join(" ");
    }
    if (typeof name === "object") name = name[meta % name.length];
    return name;
}

export function getItemTexture(id, meta) {
    const texture = ItemTextures[id];
    if (typeof texture === "object") return texture[meta % texture.length];
    return texture;
}

export function getItemIdByName(name) {
    return Ids[name.toUpperCase()];
}

/**
 * @param {number} id
 * @param {string | 0} texture
 * @param {string | Object | 0} name
 * @param {number | 0} edible
 * @param {number | 0} durability
 * @param {number | 0} maxStack
 * @param {0 | 1} isArmor
 * @param {number | 0} toolType
 * @param {number | 0} toolLevel
 * @param {number | 0} fuel
 * @param {ID | 0} smeltsTo
 * @param {number | 0} smeltXP
 * @param {number} armorType
 * @param {number} armorLevel
 * @param {number} armorPoints
 */
function registerItem(id, {
    texture = 0, name = 0, edible = 0, durability = 0, maxStack = 0,
    isArmor = 0, toolType = -1, toolLevel = -1, fuel = 0, smeltsTo = 0, smeltXP = 0,
    armorType = -1, armorLevel = -1, armorPoints = 0
} = {}) {
    if (Metadata.item.includes(id)) throw new Error("ID is already in use: " + id);
    ItemTextures[id] = texture || "assets/items/" + Object.keys(Ids).find(k => Ids[k] === id).toLowerCase() + ".png";
    Metadata.item.push(id);
    if (toolLevel !== -1) Metadata.toolLevelItems[id] = toolLevel;
    if (toolType !== -1) Metadata.toolTypeItems[id] = toolType;
    if (armorLevel !== -1) Metadata.armorLevels[id] = armorLevel;
    if (armorType !== -1) Metadata.armorTypes[id] = armorType;
    if (armorPoints) Metadata.armorPoints[id] = armorPoints;
    if (edible) Metadata.edible[id] = edible;
    if (name) Metadata.itemName[id] = name;
    if (durability) Metadata.durabilities[id] = durability;
    if (maxStack) Metadata.maxStack[id] = maxStack;
    if (isArmor) Metadata.armors.push(id);
    if (fuel) Metadata.fuel[id] = fuel;
    // https://minecraft.fandom.com/wiki/Smelting#Foods
    if (smeltsTo) Metadata.smeltsTo[id] = smeltsTo;
    if (smeltXP) Metadata.smeltXP[id] = smeltXP;
    // console.debug("%cRegistered item with the ID " + id, "color: #00ff00");
}

export function initItems() {
    // REGULAR ITEMS
    for (const id of [
        Ids.GOLD_INGOT, Ids.IRON_INGOT, Ids.WHEAT_SEEDS, Ids.LEATHER, Ids.STICK, Ids.DIAMOND, Ids.FLINT,
        Ids.IRON_NUGGET, Ids.GOLDEN_NUGGET, Ids.COAL_BLOCK, Ids.IRON_BLOCK, Ids.GOLD_BLOCK, Ids.DIAMOND_BLOCK,
        Ids.COAL, Ids.CHARCOAL
    ]) registerItem(id);

    Metadata.fuel[Ids.CHARCOAL] = Metadata.fuel[Ids.COAL] = 8;
    Metadata.fuel[Ids.COAL_BLOCK] = 80;

// EDIBLES
    registerItem(Ids.APPLE, {edible: 4});
    registerItem(Ids.RAW_BEEF, {
        edible: 3,
        smeltsTo: new ID(Ids.COOKED_BEEF),
        smeltXP: 0.35
    });
    registerItem(Ids.COOKED_BEEF, {
        edible: 8
    });
    registerItem(Ids.POTATO, {
        edible: 1,
        smeltsTo: new ID(Ids.BAKED_POTATO),
        smeltXP: 0.35
    });
    registerItem(Ids.BAKED_POTATO, {
        edible: 5
    });
    registerItem(Ids.RAW_PORKCHOP, {
        edible: 3,
        smeltsTo: new ID(Ids.COOKED_PORKCHOP),
        smeltXP: 0.35
    });
    registerItem(Ids.COOKED_PORKCHOP, {
        edible: 8
    });
    registerItem(Ids.RAW_MUTTON, {
        edible: 2,
        smeltsTo: new ID(Ids.COOKED_MUTTON),
        smeltXP: 0.35
    });
    registerItem(Ids.COOKED_MUTTON, {
        edible: 6
    });
    registerItem(Ids.RAW_CHICKEN, {
        edible: 2,
        smeltsTo: new ID(Ids.COOKED_CHICKEN),
        smeltXP: 0.35
    });
    registerItem(Ids.COOKED_CHICKEN, {
        edible: 6
    });

// TOOLS
    registerItem(Ids.FLINT_AND_STEEL, {maxStack: 1, durability: 64});

    const toolTypeInd = [TOOL_TYPES.SWORD, TOOL_TYPES.AXE, TOOL_TYPES.PICKAXE, TOOL_TYPES.SHOVEL, TOOL_TYPES.HOE];

    [Ids.GOLDEN_SWORD, Ids.GOLDEN_AXE, Ids.GOLDEN_PICKAXE, Ids.GOLDEN_SHOVEL, Ids.GOLDEN_HOE].forEach((id, index) => registerItem(id, {
        maxStack: 1, durability: 31, toolLevel: TOOL_LEVEL.GOLDEN,
        smeltsTo: new ID(Ids.GOLDEN_NUGGET),
        smeltXP: 0.1, toolType: toolTypeInd[index]
    }));
    [Ids.WOODEN_SWORD, Ids.WOODEN_AXE, Ids.WOODEN_PICKAXE, Ids.WOODEN_SHOVEL, Ids.WOODEN_HOE].forEach((id, index) => registerItem(id, {
        maxStack: 1, durability: 59, toolLevel: TOOL_LEVEL.WOODEN,
        fuel: 1, toolType: toolTypeInd[index]
    }));
    [Ids.STONE_SWORD, Ids.STONE_AXE, Ids.STONE_PICKAXE, Ids.STONE_SHOVEL, Ids.STONE_HOE].forEach((id, index) => registerItem(id, {
        maxStack: 1, durability: 131, toolLevel: TOOL_LEVEL.STONE, toolType: toolTypeInd[index]
    }));
    [Ids.IRON_SWORD, Ids.IRON_AXE, Ids.IRON_PICKAXE, Ids.IRON_SHOVEL, Ids.IRON_HOE].forEach((id, index) => registerItem(id, {
        maxStack: 1, durability: 250, toolLevel: TOOL_LEVEL.IRON,
        smeltsTo: new ID(Ids.IRON_NUGGET),
        smeltXP: 0.1, toolType: toolTypeInd[index]
    }));
    [Ids.DIAMOND_SWORD, Ids.DIAMOND_AXE, Ids.DIAMOND_PICKAXE, Ids.DIAMOND_SHOVEL, Ids.DIAMOND_HOE].forEach((id, index) => registerItem(id, {
        maxStack: 1, durability: 1561, toolLevel: TOOL_LEVEL.DIAMOND, toolType: toolTypeInd[index]
    }));

    const armorTypeInd = [ARMOR_TYPES.HELMET, ARMOR_TYPES.CHESTPLATE, ARMOR_TYPES.LEGGINGS, ARMOR_TYPES.BOOTS];
    const leatherArmorPoints = [1, 3, 2, 1];
    const goldenArmorPoints = [2, 5, 3, 1];
    const ironArmorPoints = [2, 6, 5, 2];
    const diamondArmorPoints = [3, 8, 6, 3];
    const leatherDurabilities = [55, 80, 75, 65];
    const ironDurabilities = [165, 240, 225, 195];
    const goldenDurabilities = [77, 112, 105, 91];
    const diamondDurabilities = [363, 528, 495, 429];

    [Ids.LEATHER_HELMET, Ids.LEATHER_CHESTPLATE, Ids.LEATHER_LEGGINGS, Ids.LEATHER_BOOTS].forEach((id, index) => registerItem(id, {
        maxStack: 1,
        durability: leatherDurabilities[index],
        armorLevel: ARMOR_LEVEL.LEATHER,
        armorType: armorTypeInd[index],
        armorPoints: leatherArmorPoints[index]
    }));

    [Ids.IRON_HELMET, Ids.IRON_CHESTPLATE, Ids.IRON_LEGGINGS, Ids.IRON_BOOTS].forEach((id, index) => registerItem(id, {
        maxStack: 1,
        durability: ironDurabilities[index],
        armorLevel: ARMOR_LEVEL.IRON,
        armorType: armorTypeInd[index],
        smeltsTo: new ID(Ids.IRON_NUGGET),
        smeltXP: 0.1,
        armorPoints: ironArmorPoints[index]
    }));

    [Ids.GOLDEN_HELMET, Ids.GOLDEN_CHESTPLATE, Ids.GOLDEN_LEGGINGS, Ids.GOLDEN_BOOTS].forEach((id, index) => registerItem(id, {
        maxStack: 1,
        durability: goldenDurabilities[index],
        armorLevel: ARMOR_LEVEL.GOLDEN,
        armorType: armorTypeInd[index],
        smeltsTo: new ID(Ids.GOLDEN_NUGGET),
        smeltXP: 0.1,
        armorPoints: goldenArmorPoints[index]
    }));

    [Ids.DIAMOND_HELMET, Ids.DIAMOND_CHESTPLATE, Ids.DIAMOND_LEGGINGS, Ids.DIAMOND_BOOTS].forEach((id, index) => registerItem(id, {
        maxStack: 1,
        durability: diamondDurabilities[index],
        armorLevel: ARMOR_LEVEL.DIAMOND,
        armorType: armorTypeInd[index],
        armorPoints: diamondArmorPoints[index]
    }));
}