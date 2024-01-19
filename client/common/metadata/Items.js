import {Metadata, TOOL_LEVEL, TOOL_TYPES} from "./Metadata.js";
import {Ids} from "./Ids.js";

export const ItemTextures = {};

export function getItemMaxStack(id) {
    return Metadata.maxStack[id] ?? 64;
}

export function getItemName(id, meta) {
    let name = Metadata.itemName[id];
    if (!name) {
        name = Object.keys(Ids).find(i => Ids[i] === id);
        if (!name) return "Unknown";
        return name.split("_").map(i => i[0] + i.slice(1).toLowerCase()).join(" ");
    }
    if (typeof name === "object") name = name[meta];
    return name;
}

export function getItemTexture(id, meta) {
    let texture = ItemTextures[id];
    if (typeof texture === "object") texture = texture[meta];
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
 * @param {number} toolType
 * @param {number} toolLevel
 */
function registerItem(id, {
    texture = 0, name = 0, edible = 0, durability = 0, maxStack = 0,
    isArmor = 0, toolType = -1, toolLevel = -1
} = {}) {
    ItemTextures[id] = texture || "assets/items/" + Object.keys(Ids).find(k => Ids[k] === id).toLowerCase() + ".png";
    Metadata.item.push(id);
    if (toolLevel !== -1) Metadata.toolLevelItems[id] = toolLevel;
    if (toolType !== -1) Metadata.toolTypeItems[id] = toolType;
    if (edible) Metadata.edible[id] = edible;
    if (name) Metadata.itemName[id] = name;
    if (durability) Metadata.durabilities[id] = durability;
    if (maxStack) Metadata.maxStack[id] = maxStack;
    if (isArmor) Metadata.armors.push(id);
    // console.debug("%cRegistered item with the ID " + id, "color: #00ff00");
}

registerItem(Ids.APPLE, {edible: 4});
registerItem(Ids.RAW_BEEF, {edible: 6});
registerItem(Ids.COOKED_BEEF, {edible: 8});
registerItem(Ids.FLINT_AND_STEEL, {maxStack: 1, durability: 64});
for (const id of [
    Ids.GOLD_INGOT, Ids.IRON_INGOT, Ids.WHEAT_SEEDS, Ids.LEATHER, Ids.STICK, Ids.COAL, Ids.DIAMOND, Ids.FLINT
]) registerItem(id);
for (const id of [
    Ids.GOLDEN_SWORD, Ids.GOLDEN_AXE, Ids.GOLDEN_PICKAXE, Ids.GOLDEN_SHOVEL, Ids.GOLDEN_HOE
]) registerItem(id, {
    maxStack: 1, durability: 31, toolLevel: TOOL_LEVEL.GOLDEN
});
for (const id of [
    Ids.WOODEN_SWORD, Ids.WOODEN_AXE, Ids.WOODEN_PICKAXE, Ids.WOODEN_SHOVEL, Ids.WOODEN_HOE
]) registerItem(id, {
    maxStack: 1, durability: 59, toolLevel: TOOL_LEVEL.WOODEN
});
for (const id of [
    Ids.STONE_SWORD, Ids.STONE_AXE, Ids.STONE_PICKAXE, Ids.STONE_SHOVEL, Ids.STONE_HOE
]) registerItem(id, {
    maxStack: 1, durability: 131, toolLevel: TOOL_LEVEL.STONE
});
for (const id of [
    Ids.IRON_SWORD, Ids.IRON_AXE, Ids.IRON_PICKAXE, Ids.IRON_SHOVEL, Ids.IRON_HOE
]) registerItem(id, {
    maxStack: 1, durability: 250, toolLevel: TOOL_LEVEL.IRON
});
for (const id of [
    Ids.DIAMOND_SWORD, Ids.DIAMOND_AXE, Ids.DIAMOND_PICKAXE, Ids.DIAMOND_SHOVEL, Ids.DIAMOND_HOE
]) registerItem(id, {
    maxStack: 1, durability: 1561, toolLevel: TOOL_LEVEL.DIAMOND
});

for (const id of [
    Ids.WOODEN_SWORD, Ids.STONE_SWORD, Ids.GOLDEN_SWORD, Ids.IRON_SWORD, Ids.DIAMOND_SWORD
]) Metadata.toolTypeItems[id] = TOOL_TYPES.SWORD;
for (const id of [
    Ids.WOODEN_AXE, Ids.STONE_AXE, Ids.GOLDEN_AXE, Ids.IRON_AXE, Ids.DIAMOND_AXE
]) Metadata.toolTypeItems[id] = TOOL_TYPES.AXE;
for (const id of [
    Ids.WOODEN_PICKAXE, Ids.STONE_PICKAXE, Ids.GOLDEN_PICKAXE, Ids.IRON_PICKAXE, Ids.DIAMOND_PICKAXE
]) Metadata.toolTypeItems[id] = TOOL_TYPES.PICKAXE;
for (const id of [
    Ids.WOODEN_SHOVEL, Ids.STONE_SHOVEL, Ids.GOLDEN_SHOVEL, Ids.IRON_SHOVEL, Ids.DIAMOND_SHOVEL
]) Metadata.toolTypeItems[id] = TOOL_TYPES.SHOVEL;
for (const id of [
    Ids.WOODEN_HOE, Ids.STONE_HOE, Ids.GOLDEN_HOE, Ids.IRON_HOE, Ids.DIAMOND_HOE
]) Metadata.toolTypeItems[id] = TOOL_TYPES.HOE;