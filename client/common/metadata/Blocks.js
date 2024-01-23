import {Ids} from "./Ids.js";
import {Metadata, TOOL_LEVEL, TOOL_MULTIPLIERS, TOOL_TYPES} from "./Metadata.js";
import {ItemTextures} from "./Items.js";
import {Item, ItemDescriptor as ID} from "../item/Item.js";

export const BlockTextures = {};

export function getBlockTexture(id, meta) {
    let texture = BlockTextures[id];
    if (typeof texture === "object") return texture[meta];
    return texture;
}

export function getBlockDrops(id, meta, handItem) {
    const itemToolType = Metadata.toolTypeItems[handItem ? handItem.id : 0] ?? -1;
    const itemToolLevel = Metadata.toolLevelItems[handItem ? handItem.id : 0] ?? TOOL_LEVEL.NONE;
    const blockToolType = Metadata.toolType[id];
    const blockToolLevel = Metadata.toolLevel[id];
    const isCorrectTool = itemToolType !== -1 && itemToolType === blockToolType;
    const isCorrectLevel = !blockToolLevel || blockToolLevel <= itemToolLevel;
    if (blockToolLevel && (!isCorrectTool || !isCorrectLevel)) return [];

    let drops = Metadata.blockDrops[id];
    if (!drops) return [new Item(id, meta)];
    if (!Array.isArray(drops)) drops = drops[meta];
    return drops.map(i => i.evaluate()).filter(Boolean);
}

export function isBlockItem(id) {
    return Metadata.block.includes(id);
}

export function getBlockHardness(id, itemId, efficiencyLevel, hasteLevel) {
    const base = Metadata.hardness[id];
    if (base <= 0) return base;
    const itemToolType = Metadata.toolTypeItems[itemId] ?? -1;
    const itemToolLevel = Metadata.toolLevelItems[itemId] ?? TOOL_LEVEL.NONE;
    const blockToolType = Metadata.toolType[id];
    const blockToolLevel = Metadata.toolLevel[id];
    const isCorrectTool = itemToolType !== -1 && itemToolType === blockToolType;
    const isCorrectLevel = !blockToolLevel || blockToolLevel <= itemToolLevel;
    let multiplier = isCorrectTool ? (isCorrectLevel ? TOOL_MULTIPLIERS[itemToolLevel] : 0.5) : 1;
    if (efficiencyLevel > 0) multiplier += 1 + efficiencyLevel ** 2;
    if (hasteLevel > 0) multiplier += 0.2 * hasteLevel;
    return base / multiplier * 1.3;
}

export const STEPS = {
    CLOTH: "cloth",
    CORAL: "coral",
    GRASS: "grass",
    GRAVEL: "gravel",
    LADDER: "ladder",
    SAND: "sand",
    SCAFFOLD: "scaffold",
    SNOW: "snow",
    STONE: "stone",
    WET_GRASS: "wet_grass",
    WOOD: "wood"
};
export const DIGS = {
    CLOTH: "cloth",
    CORAL: "coral",
    GLASS: "glass",
    GRASS: "grass",
    GRAVEL: "gravel",
    SAND: "sand",
    SNOW: "snow",
    STONE: "stone",
    WET_GRASS: "wet_grass",
    WOOD: "wood"
};

/**
 * @param {number} id
 * @param {string | 0 | Record<string, string>} texture
 * @param {string | 0 | Record<string, string>} name
 * @param {boolean} isTransparent
 * @param {number[] | 0} canBePlacedOn
 * @param {number[]} cannotBePlacedOn
 * @param {boolean} canStayOnPhaseables
 * @param {boolean} canFall
 * @param {boolean} isReplaceable
 * @param {boolean} isPhaseable
 * @param {boolean} canPlaceBlockOnIt
 * @param {number} hardness
 * @param {number} toolType
 * @param {boolean} isExplodeable
 * @param {number} toolLevel
 * @param {string} step
 * @param {string} dig
 * @param {(number | [number, number])[] | Object | null} drops
 * @param {boolean} interactable
 * @param {boolean} neverBreakable
 * @param {boolean} liquid
 * @param {boolean} liquidCanBreak
 * @param {number} fuel
 * @param {ID | null} smeltsTo
 * @param {[number, number] | null} xpDrops
 * @param {number} smeltXP
 */
export function registerBlock(id, {
    texture = 0, name = 0, isTransparent = false, canBePlacedOn = 0, cannotBePlacedOn = [],
    canStayOnPhaseables = false, canFall = false, isReplaceable = false, isPhaseable = false,
    canPlaceBlockOnIt = false, isExplodeable = false, drops = null, hardness = -1, toolLevel = 0,
    toolType = -1, step = STEPS.STONE, dig = DIGS.STONE, interactable = false, neverBreakable = false,
    liquid = false, liquidCanBreak = false, fuel = 0, smeltsTo = null, xpDrops = null, smeltXP = 0
} = blockOpts) {
    if (Metadata.block.includes(id)) throw new Error("ID is already in use: " + id);
    BlockTextures[id] = ItemTextures[id] = texture || "assets/blocks/" + Object.keys(Ids).find(k => Ids[k] === id).toLowerCase() + ".png";
    Metadata.block.push(id);
    Metadata.hardness[id] = hardness;
    Metadata.step[id] = step;
    Metadata.dig[id] = dig;
    Metadata.toolLevel[id] = toolLevel;
    Metadata.toolType[id] = toolType;
    if (name) Metadata.itemName[id] = name;
    if (isTransparent) Metadata.transparent.push(id);
    if (canBePlacedOn && canBePlacedOn.length) Metadata.canBePlacedOn[id] = canBePlacedOn;
    if (canStayOnPhaseables) Metadata.canStayOnPhaseables.push(id);
    if (cannotBePlacedOn) Metadata.cannotBePlacedOn[id] = cannotBePlacedOn;
    if (canFall) Metadata.canFall.push(id);
    if (isReplaceable) Metadata.replaceable.push(id);
    if (isPhaseable) Metadata.phaseable.push(id);
    if (canPlaceBlockOnIt) Metadata.canPlaceBlockOnIt.push(id);
    if (isExplodeable) Metadata.isExplodeable.push(id);
    if (drops) Metadata.blockDrops[id] = drops;
    if (interactable) Metadata.interactable.push(id);
    if (neverBreakable) Metadata.neverBreakable.push(id);
    if (liquid) Metadata.liquid.push(id);
    if (liquidCanBreak) Metadata.liquidCanBreak.push(id);
    if (fuel) Metadata.fuel[id] = fuel;
    if (smeltsTo) Metadata.smeltsTo[id] = smeltsTo;
    if (xpDrops) Metadata.xpDrops[id] = xpDrops;
    if (smeltXP) Metadata.smeltXP[id] = smeltXP;
    // console.debug("%cRegistered block with the ID " + id, "color: #00ff00");
}

const blockOpts = {
    hardness: 0, canPlaceBlockOnIt: true, isExplodeable: true, canStayOnPhaseables: true
};

registerBlock(Ids.AIR, {
    isTransparent: true, isReplaceable: true, isPhaseable: true, drops: [], canStayOnPhaseables: true,
    neverBreakable: true
});
registerBlock(Ids.BEDROCK, {
    drops: [], canStayOnPhaseables: true, canPlaceBlockOnIt: true
});
registerBlock(Ids.COAL_ORE, {
    ...blockOpts, hardness: 3, drops: [new ID(Ids.DIAMOND)], step: STEPS.STONE, dig: DIGS.STONE,
    toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN, smeltsTo: new ID(Ids.COAL), xpDrops: [0, 2],
    smeltXP: 0.1
});
registerBlock(Ids.COBBLESTONE, {
    ...blockOpts, hardness: 2, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
    toolLevel: TOOL_LEVEL.WOODEN, smeltsTo: new ID(Ids.STONE), smeltXP: 0.1
});
registerBlock(Ids.DIAMOND_ORE, {
    ...blockOpts, drops: [new ID(Ids.DIAMOND)], hardness: 5, step: STEPS.STONE, dig: DIGS.STONE,
    toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN, smeltsTo: new ID(Ids.DIAMOND), smeltXP: 1
});
registerBlock(Ids.DIRT, {
    ...blockOpts, hardness: 0.5, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.GOLD_ORE, {
    ...blockOpts, hardness: 5, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
    toolLevel: TOOL_LEVEL.WOODEN, smeltsTo: new ID(Ids.GOLD_INGOT), smeltXP: 1
});
registerBlock(Ids.GRASS_BLOCK, {
    ...blockOpts, drops: [new ID(Ids.DIRT)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS,
    toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.SNOWY_GRASS_BLOCK, {
    ...blockOpts, drops: [new ID(Ids.DIRT)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS
});
registerBlock(Ids.ICE, {
    ...blockOpts, isTransparent: true, drops: [], hardness: 0.5, step: STEPS.STONE, dig: DIGS.GLASS,
    toolType: TOOL_TYPES.PICKAXE
});
registerBlock(Ids.PACKED_ICE, {
    ...blockOpts, isTransparent: true, hardness: 0.5, step: STEPS.STONE, dig: DIGS.GLASS, toolType: TOOL_TYPES.PICKAXE
});
registerBlock(Ids.IRON_ORE, {
    ...blockOpts, hardness: 3, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
    smeltsTo: new ID(Ids.IRON_INGOT), smeltXP: 0.7
});
registerBlock(Ids.SAND, {
    ...blockOpts, canFall: true, hardness: 0.5, step: STEPS.SAND, dig: DIGS.SAND, toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.GRAVEL, {
    ...blockOpts, canFall: true, hardness: 0.6, step: STEPS.GRAVEL, dig: DIGS.GRAVEL, toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.STONE, {
    ...blockOpts, drops: [new ID(Ids.COBBLESTONE)], hardness: 3, step: STEPS.STONE, dig: DIGS.STONE,
    toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN
});
registerBlock(Ids.TNT, {
    ...blockOpts, step: STEPS.GRASS, dig: DIGS.GRASS, name: "TNT"
});
registerBlock(Ids.FIRE, {
    ...blockOpts, isTransparent: true, canStayOnPhaseables: false, drops: [], isPhaseable: true
});

const logOptions = {
    ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
    fuel: 1.5, smeltXP: 0.15, smeltsTo: new ID(Ids.CHARCOAL),
    texture: {
        0: "assets/blocks/log_oak.png",
        1: "assets/blocks/log_big_oak.png",
        2: "assets/blocks/log_birch.png",
        3: "assets/blocks/log_jungle.png",
        4: "assets/blocks/log_spruce.png",
        5: "assets/blocks/log_acacia.png"
    },
    name: {
        0: "Oak Log",
        1: "Dark Oak Log",
        2: "Birch Log",
        3: "Jungle Log",
        4: "Spruce Log",
        5: "Acacia Log"
    }
};

registerBlock(Ids.LOG, {
    ...logOptions
});
registerBlock(Ids.NATURAL_LOG, {
    ...logOptions, isPhaseable: true, drops: {
        0: [new ID(Ids.LOG, 0)],
        1: [new ID(Ids.LOG, 1)],
        2: [new ID(Ids.LOG, 2)],
        3: [new ID(Ids.LOG, 3)],
        4: [new ID(Ids.LOG, 4)],
        5: [new ID(Ids.LOG, 5)]
    }
});

registerBlock(Ids.LEAVES, {
    ...blockOpts, isTransparent: true, hardness: 0.2, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHEARS,
    fuel: 0.2,
    drops: [new ID(Ids.APPLE).setChance(0.05)],
    texture: {
        0: "assets/blocks/leaves_oak.png",
        1: "assets/blocks/leaves_oak.png",
        2: "assets/blocks/leaves_oak.png",
        3: "assets/blocks/leaves_oak.png",
        4: "assets/blocks/leaves_oak.png",
        5: "assets/blocks/leaves_oak.png"
    },
    name: {
        0: "Oak Leaves",
        1: "Dark Oak Leaves",
        2: "Birch Leaves",
        3: "Jungle Leaves",
        4: "Spruce Leaves",
        5: "Acacia Leaves"
    }
});

registerBlock(Ids.PLANKS, {
    ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
    fuel: 1.5,
    texture: {
        0: "assets/blocks/planks_oak.png",
        1: "assets/blocks/planks_big_oak.png",
        2: "assets/blocks/planks_birch.png",
        3: "assets/blocks/planks_jungle.png",
        4: "assets/blocks/planks_spruce.png",
        5: "assets/blocks/planks_acacia.png"
    },
    name: {
        0: "Oak Planks",
        1: "Dark Oak Planks",
        2: "Birch Planks",
        3: "Jungle Planks",
        4: "Spruce Planks",
        5: "Acacia Planks"
    }
});
registerBlock(Ids.SPONGE, {
    ...blockOpts, hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.HOE
});
registerBlock(Ids.WET_SPONGE, {
    ...blockOpts, hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.HOE,
    smeltsTo: new ID(Ids.SPONGE), smeltXP: 0.15
});

const FlowerOpts = {
    isTransparent: true, canBePlacedOn: [Ids.GRASS_BLOCK, Ids.SNOWY_GRASS_BLOCK, Ids.DIRT],
    isPhaseable: true, hardness: 0, isExplodeable: true, canStayOnPhaseables: false, dig: DIGS.GRASS
};
registerBlock(Ids.GRASS, {
    ...FlowerOpts, drops: [new ID(Ids.WHEAT_SEEDS)]
});
registerBlock(Ids.GRASS_DOUBLE, {
    ...FlowerOpts, drops: [new ID(Ids.WHEAT_SEEDS)]
});
export const FlowerIds = [
    Ids.ALLIUM, Ids.BLUE_ORCHID, Ids.DANDELION, Ids.HOUSTONIA, Ids.ORANGE_TULIP, Ids.OXEYE_DAISY,
    Ids.PAEONIA, Ids.PINK_TULIP, Ids.RED_TULIP, Ids.ROSE, Ids.WHITE_TULIP
];
FlowerIds.forEach(f => registerBlock(f, FlowerOpts));

const LiquidOpts = {
    isTransparent: true, canStayOnPhaseables: true, isReplaceable: true, drops: [], isPhaseable: true, liquid: true
};
registerBlock(Ids.WATER, {
    ...LiquidOpts,
    texture: {
        0: "assets/blocks/water_8.png",
        1: "assets/blocks/water_7.png",
        2: "assets/blocks/water_6.png",
        3: "assets/blocks/water_5.png",
        4: "assets/blocks/water_4.png",
        5: "assets/blocks/water_3.png",
        6: "assets/blocks/water_2.png",
        7: "assets/blocks/water_1.png",
        8: "assets/blocks/water_8.png",
    },
    neverBreakable: true
});
registerBlock(Ids.LAVA, {
    ...LiquidOpts,
    texture: {
        0: "assets/blocks/lava_4.png",
        1: "assets/blocks/lava_3.png",
        2: "assets/blocks/lava_2.png",
        3: "assets/blocks/lava_1.png",
        4: "assets/blocks/lava_4.png"
    },
    neverBreakable: true
});
registerBlock(Ids.CRAFTING_TABLE, {
    ...blockOpts, hardness: 2.5, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
    fuel: 1.5
});
registerBlock(Ids.CHEST, {
    ...blockOpts, hardness: 2.5, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
    fuel: 1.5,
    texture: {
        0: "assets/blocks/chest.png",
        1: "assets/blocks/chest_left.png",
        2: "assets/blocks/chest_right.png"
    }
});
registerBlock(Ids.FURNACE, {
    ...blockOpts, hardness: 4, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
    texture: {
        0: "assets/blocks/furnace.png",
        1: "assets/blocks/furnace_on.png"
    },
});