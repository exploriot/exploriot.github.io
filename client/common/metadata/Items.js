import {Metadata, TOOL_LEVEL, TOOL_TYPES} from "./Metadata.js";
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
    if (typeof name === "object") name = name[meta % name.__MOD];
    return name;
}

export function getItemTexture(id, meta) {
    let texture = ItemTextures[id];
    if (typeof texture === "object") {
        texture = texture[meta % texture.__MOD];
    }
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
 * @param {number | 0}
 */
function registerItem(id, {
    texture = 0, name = 0, edible = 0, durability = 0, maxStack = 0,
    isArmor = 0, toolType = -1, toolLevel = -1, fuel = 0, smeltsTo = 0, smeltXP = 0
} = {}) {
    if (Metadata.item.includes(id)) throw new Error("ID is already in use: " + id);
    ItemTextures[id] = texture || "assets/items/" + Object.keys(Ids).find(k => Ids[k] === id).toLowerCase() + ".png";
    Metadata.item.push(id);
    if (toolLevel !== -1) Metadata.toolLevelItems[id] = toolLevel;
    if (toolType !== -1) Metadata.toolTypeItems[id] = toolType;
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

for (const id of [
    Ids.GOLDEN_SWORD, Ids.GOLDEN_AXE, Ids.GOLDEN_PICKAXE, Ids.GOLDEN_SHOVEL, Ids.GOLDEN_HOE
]) registerItem(id, {
    maxStack: 1, durability: 31, toolLevel: TOOL_LEVEL.GOLDEN,
    smeltsTo: new ID(Ids.GOLDEN_NUGGET),
    smeltXP: 0.1
});
for (const id of [
    Ids.WOODEN_SWORD, Ids.WOODEN_AXE, Ids.WOODEN_PICKAXE, Ids.WOODEN_SHOVEL, Ids.WOODEN_HOE
]) registerItem(id, {
    maxStack: 1, durability: 59, toolLevel: TOOL_LEVEL.WOODEN, fuel: 1
});
for (const id of [
    Ids.STONE_SWORD, Ids.STONE_AXE, Ids.STONE_PICKAXE, Ids.STONE_SHOVEL, Ids.STONE_HOE
]) registerItem(id, {
    maxStack: 1, durability: 131, toolLevel: TOOL_LEVEL.STONE
});
for (const id of [
    Ids.IRON_SWORD, Ids.IRON_AXE, Ids.IRON_PICKAXE, Ids.IRON_SHOVEL, Ids.IRON_HOE
]) registerItem(id, {
    maxStack: 1, durability: 250, toolLevel: TOOL_LEVEL.IRON,
    smeltsTo: new ID(Ids.IRON_NUGGET),
    smeltXP: 0.1
});
for (const id of [
    Ids.DIAMOND_SWORD, Ids.DIAMOND_AXE, Ids.DIAMOND_PICKAXE, Ids.DIAMOND_SHOVEL, Ids.DIAMOND_HOE
]) registerItem(id, {
    maxStack: 1, durability: 1561, toolLevel: TOOL_LEVEL.DIAMOND
});

for (const o of [
    [TOOL_TYPES.SWORD, [Ids.WOODEN_SWORD, Ids.STONE_SWORD, Ids.GOLDEN_SWORD, Ids.IRON_SWORD, Ids.DIAMOND_SWORD]],
    [TOOL_TYPES.AXE, [Ids.WOODEN_AXE, Ids.STONE_AXE, Ids.GOLDEN_AXE, Ids.IRON_AXE, Ids.DIAMOND_AXE]],
    [TOOL_TYPES.PICKAXE, [Ids.WOODEN_PICKAXE, Ids.STONE_PICKAXE, Ids.GOLDEN_PICKAXE, Ids.IRON_PICKAXE, Ids.DIAMOND_PICKAXE]],
    [TOOL_TYPES.SHOVEL, [Ids.WOODEN_SHOVEL, Ids.STONE_SHOVEL, Ids.GOLDEN_SHOVEL, Ids.IRON_SHOVEL, Ids.DIAMOND_SHOVEL]],
    [TOOL_TYPES.HOE, [Ids.WOODEN_HOE, Ids.STONE_HOE, Ids.GOLDEN_HOE, Ids.IRON_HOE, Ids.DIAMOND_HOE]],
]) for (const id of o[1]) Metadata.toolTypeItems[id] = o[0];