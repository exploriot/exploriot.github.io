import {Ids} from "./Ids.js";
import {Metadata, TOOL_LEVEL, TOOL_MULTIPLIERS, TOOL_TYPES} from "./Metadata.js";
import {ItemTextures} from "./Items.js";
import {Item, ItemDescriptor as ID} from "../item/Item.js";
import {BoundingBox} from "../entity/BoundingBox.js";

export const BlockTextures = {};

export const BLOCK_BB = new BoundingBox(-0.5, -0.5, 0.5, 0.5);

export const LEFT_HALF_BB = new BoundingBox(0, -0.5, 0.5, 0.5);
export const RIGHT_HALF_BB = new BoundingBox(-0.5, -0.5, 0, 0.5);

export const TOP_HALF_BB = new BoundingBox(-0.5, 0, 0.5, 0.5);
export const BOTTOM_HALF_BB = new BoundingBox(-0.5, -0.5, 0.5, 0);

export const LEFT_TOP_HALF_BB = new BoundingBox(0, 0, 0.5, 0.5);
export const RIGHT_TOP_HALF_BB = new BoundingBox(0, 0, 0.5, 0.5);

export const LEFT_BOTTOM_HALF_BB = new BoundingBox(-0.5, -0.5, 0, 0);
export const RIGHT_BOTTOM_HALF_BB = new BoundingBox(0, 0, 0.5, -0.5);

export const SLAB_BB = [
    BOTTOM_HALF_BB,
    LEFT_HALF_BB,
    TOP_HALF_BB,
    RIGHT_HALF_BB
];
export const STAIRS_BB = [
    [BOTTOM_HALF_BB, RIGHT_TOP_HALF_BB],
    [BOTTOM_HALF_BB, LEFT_TOP_HALF_BB],
    [LEFT_BOTTOM_HALF_BB, TOP_HALF_BB],
    [RIGHT_BOTTOM_HALF_BB, TOP_HALF_BB]
];


export function getBlockTexture(id, meta) {
    let texture = BlockTextures[id];
    if (typeof texture === "object") return texture[meta % texture.__MOD];
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
    if (!drops) {
        const texture = BlockTextures[id];
        return [new Item(
            id,
            typeof texture === "object" ? meta % BlockTextures[id].__MOD : meta
        )];
    }
    if (!Array.isArray(drops)) drops = drops[meta % drops.__MOD];
    return drops.map(i => i.evaluate()).filter(Boolean);
}

export function isBlockItem(id) {
    return Metadata.block.includes(id);
}

export function getBoundingBoxesOf(id, meta) {
    if (Metadata.slab.includes(id) || Metadata.stairs.includes(id)) {
        const texture = BlockTextures[id];
        const div = typeof texture === "object" ? texture.__MOD : 1;
        const rotation = Math.floor(meta / div);
        return (Metadata.slab.includes(id) ? SLAB_BB : STAIRS_BB)[rotation];
    } else return BLOCK_BB;
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
 * @param {string | 0 | Record<any, any>} texture
 * @param {string | 0 | Record<any, any>} name
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
 * @param {boolean} slab
 * @param {boolean} stairs
 */
export function registerBlock(id, {
    texture = 0, name = 0, isTransparent = false, canBePlacedOn = 0, cannotBePlacedOn = [],
    canStayOnPhaseables = false, canFall = false, isReplaceable = false, isPhaseable = false,
    canPlaceBlockOnIt = false, isExplodeable = false, drops = null, hardness = -1, toolLevel = 0,
    toolType = -1, step = STEPS.STONE, dig = DIGS.STONE, interactable = false, neverBreakable = false,
    liquid = false, liquidCanBreak = false, fuel = 0, smeltsTo = null, xpDrops = null, smeltXP = 0,
    slab = false, stairs = false
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
    if (slab) Metadata.slab.push(id);
    if (stairs) Metadata.stairs.push(id);
    // console.debug("%cRegistered block with the ID " + id, "color: #00ff00");
}

export const FlowerIds = [
    Ids.ALLIUM, Ids.BLUE_ORCHID, Ids.DANDELION, Ids.HOUSTONIA, Ids.ORANGE_TULIP, Ids.OXEYE_DAISY,
    Ids.PAEONIA, Ids.PINK_TULIP, Ids.RED_TULIP, Ids.ROSE, Ids.WHITE_TULIP
];

export function initBlocks() {
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

    const cobbOpts = {
        ...blockOpts, hardness: 2, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
        toolLevel: TOOL_LEVEL.WOODEN, smeltsTo: new ID(Ids.STONE), smeltXP: 0.1
    };
    registerBlock(Ids.COBBLESTONE, cobbOpts);
    registerBlock(Ids.COBBLESTONE_SLAB, {
        ...cobbOpts, slab: true, isTransparent: true
    });
    registerBlock(Ids.COBBLESTONE_STAIRS, {
        ...cobbOpts, stairs: true, isTransparent: true
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
        ...blockOpts,
        isTransparent: true,
        hardness: 0.5,
        step: STEPS.STONE,
        dig: DIGS.GLASS,
        toolType: TOOL_TYPES.PICKAXE
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

    const stoneOpts = {
        ...blockOpts, hardness: 3, step: STEPS.STONE, dig: DIGS.STONE,
        toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN
    };
    registerBlock(Ids.STONE, {
        ...stoneOpts, drops: [new ID(Ids.COBBLESTONE)]
    });
    registerBlock(Ids.STONE_SLAB, {
        ...stoneOpts, slab: true, isTransparent: true
    });
    registerBlock(Ids.STONE_STAIRS, {
        ...stoneOpts, stairs: true, isTransparent: true
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
            5: "assets/blocks/log_acacia.png",
            __MOD: 6
        },
        name: {
            0: "Oak Log",
            1: "Dark Oak Log",
            2: "Birch Log",
            3: "Jungle Log",
            4: "Spruce Log",
            5: "Acacia Log",
            __MOD: 6
        }
    };

    registerBlock(Ids.LOG, {
        ...logOptions
    });
    registerBlock(Ids.NATURAL_LOG, {
        ...logOptions, isPhaseable: true, isTransparent: true, drops: {
            0: [new ID(Ids.LOG, 0)],
            1: [new ID(Ids.LOG, 1)],
            2: [new ID(Ids.LOG, 2)],
            3: [new ID(Ids.LOG, 3)],
            4: [new ID(Ids.LOG, 4)],
            5: [new ID(Ids.LOG, 5)],
            __MOD: 6
        }
    });

    registerBlock(Ids.WOODEN_SLAB, {
        ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, slab: true, isTransparent: true,
        texture: {
            0: "assets/blocks/planks_oak_slab.png",
            1: "assets/blocks/planks_big_oak_slab.png",
            2: "assets/blocks/planks_birch_slab.png",
            3: "assets/blocks/planks_jungle_slab.png",
            4: "assets/blocks/planks_spruce_slab.png",
            5: "assets/blocks/planks_acacia_slab.png",
            __MOD: 6
        },
        name: {
            0: "Oak Slab",
            1: "Dark Oak Slab",
            2: "Birch Slab",
            3: "Jungle Slab",
            4: "Spruce Slab",
            5: "Acacia Slab",
            __MOD: 6
        }
    });
    registerBlock(Ids.WOODEN_STAIRS, {
        ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, stairs: true, isTransparent: true,
        texture: {
            0: "assets/blocks/planks_oak_stairs.png",
            1: "assets/blocks/planks_big_oak_stairs.png",
            2: "assets/blocks/planks_birch_stairs.png",
            3: "assets/blocks/planks_jungle_stairs.png",
            4: "assets/blocks/planks_spruce_stairs.png",
            5: "assets/blocks/planks_acacia_stairs.png",
            __MOD: 6
        },
        name: {
            0: "Oak Stairs",
            1: "Dark Oak Stairs",
            2: "Birch Stairs",
            3: "Jungle Stairs",
            4: "Spruce Stairs",
            5: "Acacia Stairs",
            __MOD: 6
        }
    });

    registerBlock(Ids.LEAVES, {
        ...blockOpts,
        isTransparent: true,
        hardness: 0.2,
        step: STEPS.GRASS,
        dig: DIGS.GRASS,
        toolType: TOOL_TYPES.SHEARS,
        fuel: 0.2,
        drops: [new ID(Ids.APPLE).setChance(0.05)],
        texture: {
            0: "assets/blocks/leaves_oak.png",
            1: "assets/blocks/leaves_dark_oak.png",
            2: "assets/blocks/leaves_birch.png",
            3: "assets/blocks/leaves_jungle.png",
            4: "assets/blocks/leaves_spruce.png",
            5: "assets/blocks/leaves_acacia.png",
            __MOD: 6
        },
        name: {
            0: "Oak Leaves",
            1: "Dark Oak Leaves",
            2: "Birch Leaves",
            3: "Jungle Leaves",
            4: "Spruce Leaves",
            5: "Acacia Leaves",
            __MOD: 6
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
            5: "assets/blocks/planks_acacia.png",
            __MOD: 6
        },
        name: {
            0: "Oak Planks",
            1: "Dark Oak Planks",
            2: "Birch Planks",
            3: "Jungle Planks",
            4: "Spruce Planks",
            5: "Acacia Planks",
            __MOD: 6
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
            __MOD: 9
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
            4: "assets/blocks/lava_4.png",
            __MOD: 5
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
            2: "assets/blocks/chest_right.png",
            __MOD: 3
        }
    });
    registerBlock(Ids.FURNACE, {
        ...blockOpts, hardness: 4, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
        texture: {
            0: "assets/blocks/furnace.png",
            1: "assets/blocks/furnace_on.png",
            __MOD: 3
        },
    });
}