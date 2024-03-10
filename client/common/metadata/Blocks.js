import {Ids} from "./Ids.js";
import {Metadata, TOOL_LEVEL, TOOL_MULTIPLIERS, TOOL_TYPES} from "./Metadata.js";
import {Item, ItemDescriptor as ID} from "../item/Item.js";
import {BoundingBox} from "../entity/BoundingBox.js";
import {randInt} from "../Utils.js";
import {Texture} from "../../loader/Texture.js";
import {getTextureURL} from "./Items.js";

export const BlockTextures = {};

export const BLOCK_BB = new BoundingBox(-0.5, -0.5, 0.5, 0.5);

export const LEFT_HALF_BB = new BoundingBox(-0.5, -0.5, 0, 0.5);
export const RIGHT_HALF_BB = new BoundingBox(0, -0.5, 0.5, 0.5);

export const TOP_HALF_BB = new BoundingBox(-0.5, 0, 0.5, 0.5);
export const BOTTOM_HALF_BB = new BoundingBox(-0.5, -0.5, 0.5, 0);

export const LEFT_TOP_HALF_BB = new BoundingBox(-0.5, 0, 0, 0.5);
export const RIGHT_TOP_HALF_BB = new BoundingBox(0, 0, 0.5, 0.5);

export const LEFT_BOTTOM_HALF_BB = new BoundingBox(-0.5, -0.5, 0, 0);
export const RIGHT_BOTTOM_HALF_BB = new BoundingBox(0, -0.5, 0.5, 0.5);

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
    const f = id + ":" + meta;
    if (f in BlockTextures) return BlockTextures[f];
    return BlockTextures[f] = Texture.get(getTextureURL(id, meta));
}

export function getBlockDrops(id, meta, handItem) {
    if (id === Ids.GRAVEL && Math.random() < 0.1) return [new Item(Ids.FLINT)];
    const itemToolType = Metadata.toolTypeItems[handItem ? handItem.id : 0] ?? TOOL_TYPES.NONE;
    const itemToolLevel = Metadata.toolLevelItems[handItem ? handItem.id : 0] ?? TOOL_LEVEL.NONE;
    const blockToolType = Metadata.toolType[id] ?? TOOL_TYPES.NONE;
    const blockToolLevel = Metadata.toolLevel[id] ?? TOOL_LEVEL.NONE;
    const isCorrectTool = itemToolType !== TOOL_TYPES.NONE && itemToolType === blockToolType;
    const isCorrectLevel = !blockToolLevel || blockToolLevel <= itemToolLevel;
    if (blockToolLevel && (!isCorrectTool || !isCorrectLevel)) return [];

    let drops = Metadata.blockDrops[id];
    if (!drops) return [new Item(
        id,
        meta % getBlockMetaMod(id)
    )];
    if (Array.isArray(drops[0])) drops = drops[meta % drops.length];
    return drops.map(i => i.evaluate()).filter(Boolean);
}

export function isBlockItem(id) {
    return Metadata.block.includes(id);
}

export function getBlockMetaMod(id) {
    const t = Metadata.textures[id];
    if (!Array.isArray(t)) return 1;
    return t.length;
}

export function getBoundingBoxesOf(id, meta) {
    if (Metadata.slab.includes(id) || Metadata.stairs.includes(id)) {
        const rotation = Math.floor(meta / getBlockMetaMod(id));
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

export function getBlockDigSound(id) {
    if (id === Ids.FIRE) return "assets/sounds/random/fizz.ogg";
    const soundType = Metadata.dig[id];
    if (!soundType) return null;
    const num = randInt(1, soundType[1]);
    return "assets/sounds/dig/" + soundType[0] + num + ".ogg";
}

export function getBlockStepSound(id) {
    const soundType = Metadata.step[id];
    if (!soundType) return null;
    const num = randInt(1, soundType[1]);
    return "assets/sounds/step/" + soundType[0] + num + ".ogg";
}

export const STEPS = {
    CLOTH: ["cloth", 4],
    CORAL: ["coral", 6],
    GRASS: ["grass", 6],
    GRAVEL: ["gravel", 4],
    LADDER: ["ladder", 5],
    SAND: ["sand", 5],
    SCAFFOLD: ["scaffold", 7],
    SNOW: ["snow", 4],
    STONE: ["stone", 6],
    WET_GRASS: ["wet_grass", 6],
    WOOD: ["wood", 6]
};
export const DIGS = {
    CLOTH: ["cloth", 4],
    CORAL: ["coral", 4],
    GLASS: ["glass", 4],
    GRASS: ["grass", 4],
    GRAVEL: ["gravel", 4],
    SAND: ["sand", 4],
    SNOW: ["snow", 4],
    STONE: ["stone", 4],
    WET_GRASS: ["wet_grass", 4],
    WOOD: ["wood", 4]
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
 * @param {[string, number]} step
 * @param {[string, number]} dig
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
 * @param {boolean} canReplaceBlocks
 */
export function registerBlock(id, {
    texture = 0, name = 0, isTransparent = false, canBePlacedOn = 0, cannotBePlacedOn = [],
    canStayOnPhaseables = false, canFall = false, isReplaceable = false, isPhaseable = false,
    canPlaceBlockOnIt = false, isExplodeable = false, drops = null, hardness = -1, toolLevel = 0,
    toolType = -1, step = STEPS.STONE, dig = DIGS.STONE, interactable = false, neverBreakable = false,
    liquid = false, liquidCanBreak = false, fuel = 0, smeltsTo = null, xpDrops = null, smeltXP = 0,
    slab = false, stairs = false, canReplaceBlocks = true
} = blockOpts) {
    if (Metadata.block.includes(id)) throw new Error("ID is already in use: " + id);
    Metadata.textures[id] = texture || "assets/blocks/" + Object.keys(Ids).find(k => k[0] !== "_" && Ids[k] === id).toLowerCase() + ".png";
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
    if (canReplaceBlocks) Metadata.canReplaceBlocks.push(id);
    // console.debug("%cRegistered block with the ID " + id, "color: #00ff00");
}

export const FlowerIds = [
    Ids.ALLIUM, Ids.BLUE_ORCHID, Ids.DANDELION, Ids.HOUSTONIA, Ids.ORANGE_TULIP, Ids.OXEYE_DAISY,
    Ids.PAEONIA, Ids.PINK_TULIP, Ids.RED_TULIP, Ids.ROSE, Ids.WHITE_TULIP
];

const blockOpts = {
    hardness: 0, canPlaceBlockOnIt: true, isExplodeable: true, canStayOnPhaseables: true
};

export function initBlocks() {
    registerBlock(Ids.AIR, {
        isTransparent: true, isReplaceable: true, isPhaseable: true, drops: [], canStayOnPhaseables: true,
        neverBreakable: true
    });
    registerBlock(Ids.BEDROCK, {
        drops: [], canStayOnPhaseables: true, canPlaceBlockOnIt: true
    });
    registerBlock(Ids.COAL_ORE, {
        ...blockOpts, hardness: 3, drops: [new ID(Ids.COAL)], step: STEPS.STONE, dig: DIGS.STONE,
        toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.WOODEN, smeltsTo: new ID(Ids.COAL), xpDrops: [0, 2],
        smeltXP: 0.1
    });

    const cobbOpts = {
        ...blockOpts, hardness: 2, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
        toolLevel: TOOL_LEVEL.WOODEN
    };
    registerBlock(Ids.COBBLESTONE, {
        ...cobbOpts, smeltsTo: new ID(Ids.STONE), smeltXP: 0.1
    });
    registerBlock(Ids.COBBLESTONE_SLAB, {
        ...cobbOpts, slab: true, isTransparent: true
    });
    registerBlock(Ids.COBBLESTONE_STAIRS, {
        ...cobbOpts, stairs: true, isTransparent: true
    });

    registerBlock(Ids.DIAMOND_ORE, {
        ...blockOpts, drops: [new ID(Ids.DIAMOND)], hardness: 5, step: STEPS.STONE, dig: DIGS.STONE,
        toolType: TOOL_TYPES.PICKAXE, toolLevel: TOOL_LEVEL.IRON, smeltsTo: new ID(Ids.DIAMOND), smeltXP: 1
    });
    registerBlock(Ids.DIRT, {
        ...blockOpts, hardness: 0.5, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHOVEL
    });
    registerBlock(Ids.DIRT_SLAB, {
        ...blockOpts, hardness: 0.5, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHOVEL, slab: true,
        isTransparent: true
    });
    registerBlock(Ids.DIRT_STAIRS, {
        ...blockOpts, hardness: 0.5, step: STEPS.GRASS, dig: DIGS.GRASS, toolType: TOOL_TYPES.SHOVEL, stairs: true,
        isTransparent: true
    });
    registerBlock(Ids.GOLD_ORE, {
        ...blockOpts, hardness: 5, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
        toolLevel: TOOL_LEVEL.IRON, smeltsTo: new ID(Ids.GOLD_INGOT), smeltXP: 1
    });
    registerBlock(Ids.GRASS_BLOCK, {
        ...blockOpts, drops: [new ID(Ids.DIRT)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS,
        toolType: TOOL_TYPES.SHOVEL
    });
    registerBlock(Ids.GRASS_BLOCK_SLAB, {
        ...blockOpts, drops: [new ID(Ids.DIRT_SLAB)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS,
        toolType: TOOL_TYPES.SHOVEL, slab: true, isTransparent: true
    });
    registerBlock(Ids.GRASS_BLOCK_STAIRS, {
        ...blockOpts, drops: [new ID(Ids.DIRT_STAIRS)], hardness: 0.6, step: STEPS.GRASS, dig: DIGS.GRASS,
        toolType: TOOL_TYPES.SHOVEL, stairs: true, isTransparent: true
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
        toolLevel: TOOL_LEVEL.STONE,
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
        ...blockOpts, isTransparent: true, canStayOnPhaseables: false, drops: [], isPhaseable: true,
        isReplaceable: true, canReplaceBlocks: false
    });

    const logOptions = {
        ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, smeltXP: 0.15, smeltsTo: new ID(Ids.CHARCOAL),
        texture: [
            "assets/blocks/log_oak.png",
            "assets/blocks/log_big_oak.png",
            "assets/blocks/log_birch.png",
            "assets/blocks/log_jungle.png",
            "assets/blocks/log_spruce.png",
            "assets/blocks/log_acacia.png"
        ],
        name: [
            "Oak Log",
            "Dark Oak Log",
            "Birch Log",
            "Jungle Log",
            "Spruce Log",
            "Acacia Log"
        ]
    };

    registerBlock(Ids.LOG, {
        ...logOptions
    });
    registerBlock(Ids.NATURAL_LOG, {
        ...logOptions, isPhaseable: true, isTransparent: true, drops: [
            [new ID(Ids.LOG, 0)],
            [new ID(Ids.LOG, 1)],
            [new ID(Ids.LOG, 2)],
            [new ID(Ids.LOG, 3)],
            [new ID(Ids.LOG, 4)],
            [new ID(Ids.LOG, 5)]
        ]
    });

    registerBlock(Ids.WOODEN_SLAB, {
        ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, slab: true, isTransparent: true,
        texture: [
            "assets/blocks/planks_oak_slab.png",
            "assets/blocks/planks_big_oak_slab.png",
            "assets/blocks/planks_birch_slab.png",
            "assets/blocks/planks_jungle_slab.png",
            "assets/blocks/planks_spruce_slab.png",
            "assets/blocks/planks_acacia_slab.png"
        ],
        name: [
            "Oak Slab",
            "Dark Oak Slab",
            "Birch Slab",
            "Jungle Slab",
            "Spruce Slab",
            "Acacia Slab"
        ]
    });
    registerBlock(Ids.WOODEN_STAIRS, {
        ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, stairs: true, isTransparent: true,
        texture: [
            "assets/blocks/planks_oak_stairs.png",
            "assets/blocks/planks_big_oak_stairs.png",
            "assets/blocks/planks_birch_stairs.png",
            "assets/blocks/planks_jungle_stairs.png",
            "assets/blocks/planks_spruce_stairs.png",
            "assets/blocks/planks_acacia_stairs.png"
        ],
        name: [
            "Oak Stairs",
            "Dark Oak Stairs",
            "Birch Stairs",
            "Jungle Stairs",
            "Spruce Stairs",
            "Acacia Stairs"
        ]
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
        texture: [
            "assets/blocks/leaves_oak.png",
            "assets/blocks/leaves_dark_oak.png",
            "assets/blocks/leaves_birch.png",
            "assets/blocks/leaves_jungle.png",
            "assets/blocks/leaves_spruce.png",
            "assets/blocks/leaves_acacia.png"
        ],
        name: [
            "Oak Leaves",
            "Dark Oak Leaves",
            "Birch Leaves",
            "Jungle Leaves",
            "Spruce Leaves",
            "Acacia Leaves"
        ]
    });

    registerBlock(Ids.PLANKS, {
        ...blockOpts, hardness: 2, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5,
        texture: [
            "assets/blocks/planks_oak.png",
            "assets/blocks/planks_big_oak.png",
            "assets/blocks/planks_birch.png",
            "assets/blocks/planks_jungle.png",
            "assets/blocks/planks_spruce.png",
            "assets/blocks/planks_acacia.png"
        ],
        name: [
            "Oak Planks",
            "Dark Oak Planks",
            "Birch Planks",
            "Jungle Planks",
            "Spruce Planks",
            "Acacia Planks"
        ]
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
        isTransparent: true, canStayOnPhaseables: true, isReplaceable: true, drops: [], isPhaseable: true, liquid: true,
        neverBreakable: true
    };
    registerBlock(Ids.WATER, {
        ...LiquidOpts,
        texture: [
            "assets/blocks/water_8.png",
            "assets/blocks/water_7.png",
            "assets/blocks/water_6.png",
            "assets/blocks/water_5.png",
            "assets/blocks/water_4.png",
            "assets/blocks/water_3.png",
            "assets/blocks/water_2.png",
            "assets/blocks/water_1.png",
            "assets/blocks/water_8.png"
        ]
    });
    registerBlock(Ids.LAVA, {
        ...LiquidOpts,
        texture: [
            "assets/blocks/lava_4.png",
            "assets/blocks/lava_3.png",
            "assets/blocks/lava_2.png",
            "assets/blocks/lava_1.png",
            "assets/blocks/lava_4.png"
        ]
    });
    registerBlock(Ids.CRAFTING_TABLE, {
        ...blockOpts, hardness: 2.5, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, interactable: true
    });
    registerBlock(Ids.CHEST, {
        ...blockOpts, hardness: 2.5, step: STEPS.WOOD, dig: DIGS.WOOD, toolType: TOOL_TYPES.AXE,
        fuel: 1.5, interactable: true, isTransparent: true,
        texture: [
            "assets/blocks/chest.png",
            "assets/blocks/chest_left.png",
            "assets/blocks/chest_right.png"
        ]
    });
    registerBlock(Ids.FURNACE, {
        ...blockOpts, hardness: 4, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
        toolLevel: TOOL_LEVEL.WOODEN, interactable: true,
        texture: [
            "assets/blocks/furnace.png",
            "assets/blocks/furnace_on.png"
        ]
    });
    registerBlock(Ids.ANVIL, {
        ...blockOpts, hardness: 5, step: STEPS.STONE, dig: DIGS.STONE, toolType: TOOL_TYPES.PICKAXE,
        toolLevel: TOOL_LEVEL.WOODEN, isTransparent: true, interactable: true,
        name: [
            "Anvil",
            "Chipped Anvil",
            "Damaged Anvil"
        ],
        texture: [
            "assets/blocks/anvil.png",
            "assets/blocks/anvil_damaged1.png",
            "assets/blocks/anvil_damaged2.png"
        ]
    });
    const oreOptions = {
        ...blockOpts,
        step: STEPS.STONE,
        dig: DIGS.STONE,
        toolType: TOOL_TYPES.PICKAXE,
        toolLevel: TOOL_LEVEL.WOODEN
    };
    registerBlock(Ids.COAL_BLOCK, {...oreOptions, hardness: 5});
    registerBlock(Ids.IRON_BLOCK, {...oreOptions, hardness: 5});
    registerBlock(Ids.GOLD_BLOCK, {...oreOptions, hardness: 3});
    registerBlock(Ids.DIAMOND_BLOCK, {...oreOptions, hardness: 5});
    registerBlock(Ids.ENTITY_SPAWNER, {
        ...blockOpts, isTransparent: true, toolLevel: TOOL_LEVEL.WOODEN, toolType: TOOL_TYPES.PICKAXE, hardness: 5,
        drops: [], xpDrops: [15, 43], step: STEPS.STONE, dig: DIGS.STONE
    });
}