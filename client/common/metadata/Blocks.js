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

export function getBlockDrops(id, meta) {
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
    const isCorrectLevel = blockToolLevel <= itemToolLevel;
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
 * @param {0 | 1} isTransparent
 * @param {number[] | 0} canBePlacedOn
 * @param {number[]} cannotBePlacedOn
 * @param {0 | 1} canStayOnPhaseables
 * @param {0 | 1} canFall
 * @param {0 | 1} isReplaceable
 * @param {0 | 1} isPhaseable
 * @param {0 | 1} canPlaceBlockOnIt
 * @param {number} hardness
 * @param {number} toolType
 * @param {0 | 1} isExplodeable
 * @param {number} toolLevel
 * @param {string} step
 * @param {string} dig
 * @param {(number | [number, number])[] | Object | 0} drops
 * @param {0 | 1} interactable
 * @param {0 | 1} neverBreakable
 * @param {0 | 1} liquid
 * @param {0 | 1} liquidCanBreak
 */
export function registerBlock(id, {
    texture = 0, name = 0, isTransparent = 0, canBePlacedOn = 0, cannotBePlacedOn = [],
    canStayOnPhaseables = 0, canFall = 0, isReplaceable = 0, isPhaseable = 0,
    canPlaceBlockOnIt = 0, isExplodeable = 0, drops = 0, hardness = -1, toolLevel = 0,
    toolType = -1, step = STEPS.STONE, dig = DIGS.STONE, interactable = 0, neverBreakable = 0,
    liquid = 0, liquidCanBreak = 0
} = blockOpts) {
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
    // console.debug("%cRegistered block with the ID " + id, "color: #00ff00");
}

const blockOpts = {
    hardness: 0, canPlaceBlockOnIt: 1, isExplodeable: 1, canStayOnPhaseables: 1
};

registerBlock(Ids.AIR, {
    isTransparent: 1, isReplaceable: 1, isPhaseable: 1, drops: [], canStayOnPhaseables: 1, neverBreakable: 1
});
registerBlock(Ids.BEDROCK, {
    drops: [], canStayOnPhaseables: 1, canPlaceBlockOnIt: 1
});
registerBlock(Ids.COAL_ORE, {
    ...blockOpts, drops: [new ID(Ids.COAL)], hardness: 3, step: STEPS.STONE, dig: DIGS.STONE,
    toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN
});
registerBlock(Ids.COBBLESTONE, {
    ...blockOpts, hardness: 2, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
    toolLevel: TOOL_LEVEL.WOODEN
});
registerBlock(Ids.DIAMOND_ORE, {
    ...blockOpts, drops: [new ID(Ids.DIAMOND)], hardness: 5, step: STEPS.STONE, dig: DIGS.STONE,
    toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN
});
registerBlock(Ids.DIRT, {
    ...blockOpts, hardness: 0.5, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.GOLD_ORE, {
    ...blockOpts, hardness: 5, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
    toolLevel: TOOL_LEVEL.WOODEN
});
registerBlock(Ids.GRASS_BLOCK, {
    ...blockOpts, drops: [new ID(Ids.DIRT)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS,
    toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.SNOWY_GRASS_BLOCK, {
    ...blockOpts, drops: [new ID(Ids.DIRT)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS
});
registerBlock(Ids.ICE, {
    ...blockOpts, isTransparent: 1, drops: [], hardness: 0.5, step: STEPS.STONE, dig: DIGS.GLASS,
    toolType: TOOL_TYPES.PICKAXE
});
registerBlock(Ids.PACKED_ICE, {
    ...blockOpts, isTransparent: 1, hardness: 0.5, step: STEPS.STONE, dig: DIGS.GLASS, toolType: TOOL_TYPES.PICKAXE
});
registerBlock(Ids.IRON_ORE, {
    ...blockOpts, hardness: 3, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE
});
registerBlock(Ids.SAND, {
    ...blockOpts, canFall: 1, hardness: 0.5, step: STEPS.SAND, dig: DIGS.SAND, toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.GRAVEL, {
    ...blockOpts, canFall: 1, hardness: 0.6, step: STEPS.GRAVEL, dig: DIGS.GRAVEL, toolType: TOOL_TYPES.SHOVEL
});
registerBlock(Ids.STONE, {
    ...blockOpts, drops: [new ID(Ids.COBBLESTONE)], hardness: 3, step: STEPS.STONE, dig: DIGS.STONE,
    toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN
});
registerBlock(Ids.TNT, {
    ...blockOpts, step: STEPS.GRASS, dig: DIGS.GRASS, name: "TNT"
});
registerBlock(Ids.FIRE, {
    ...blockOpts, isTransparent: 1, canStayOnPhaseables: 0, drops: [], isPhaseable: 1
});

registerBlock(Ids.LOG, {
    ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
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
});
registerBlock(Ids.PLANKS, {
    ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
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
registerBlock(Ids.LEAVES, {
    ...blockOpts, isTransparent: 1, hardness: 0.2, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHEARS,
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
registerBlock(Ids.NATURAL_LOG, {
    ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
    drops: {
        0: [new ID(Ids.LOG)],
        1: [new ID(Ids.LOG, 1)],
        2: [new ID(Ids.LOG, 2)],
        3: [new ID(Ids.LOG, 3)],
        4: [new ID(Ids.LOG, 4)],
        5: [new ID(Ids.LOG, 5)]
    },
    isPhaseable: 1,
    isTransparent: 1,
    texture: {
        0: "assets/blocks/log_oak.png",
        1: "assets/blocks/log_big_oak.png",
        2: "assets/blocks/log_birch.png",
        3: "assets/blocks/log_jungle.png",
        4: "assets/blocks/log_spruce.png",
        5: "assets/blocks/log_acacia.png"
    },
    name: {
        0: "Oak Planks",
        1: "Dark Oak Planks",
        2: "Birch Planks",
        3: "Jungle Planks",
        4: "Spruce Planks",
        5: "Acacia Log"
    }
});
registerBlock(Ids.NATURAL_LEAVES, {
    ...blockOpts, drops: [new ID(Ids.APPLE).setChance(0.1)], isTransparent: 1,
    hardness: 0.2, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHEARS,
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
registerBlock(Ids.SPONGE, {
    ...blockOpts, hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.HOE
});
registerBlock(Ids.WET_SPONGE, {
    ...blockOpts, hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.HOE
});

const FlowerOpts = {
    isTransparent: 1, canBePlacedOn: [Ids.GRASS_BLOCK, Ids.SNOWY_GRASS_BLOCK, Ids.DIRT],
    isPhaseable: 1, hardness: 0, isExplodeable: 1, canStayOnPhaseables: 0, dig: DIGS.GRASS
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
    isTransparent: 1, canStayOnPhaseables: 1, isReplaceable: 1, drops: [], isPhaseable: 1, liquid: 1
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
    neverBreakable: 1
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
    neverBreakable: 1
});
registerBlock(Ids.CRAFTING_TABLE, {
    ...blockOpts, hardness: 2.5, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE
});
registerBlock(Ids.CHEST, {
    ...blockOpts, hardness: 2.5, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE
});