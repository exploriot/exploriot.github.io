import {Ids} from "./Ids.js";
import {EntityIds} from "./Entities.js";

export const PreloadTextures = [
    "destroy/0.png",
    "destroy/1.png",
    "destroy/2.png",
    "destroy/3.png",
    "destroy/4.png",
    "destroy/5.png",
    "destroy/6.png",
    "destroy/7.png",
    "destroy/8.png",
    "destroy/9.png"
];

export const TOOL_TYPES = {
    SWORD: 0,
    AXE: 1,
    PICKAXE: 2,
    SHOVEL: 3,
    HOE: 4,
    SHEARS: 5
};
export const TOOL_LEVEL = {
    NONE: 0,
    WOODEN: 1,
    STONE: 2,
    IRON: 3,
    GOLDEN: 4,
    DIAMOND: 5,
    NETHERITE: 6
};
export const TOOL_MULTIPLIERS = {
    [TOOL_LEVEL.NONE]: 1,
    [TOOL_LEVEL.WOODEN]: 2,
    [TOOL_LEVEL.STONE]: 4,
    [TOOL_LEVEL.IRON]: 6,
    [TOOL_LEVEL.DIAMOND]: 8,
    [TOOL_LEVEL.GOLDEN]: 12,
};
export const Metadata = {
    block: [],
    item: [],
    crafts: [],
    phaseable: [],
    replaceable: [],
    hardness: {},
    neverBreakable: [],
    canPlaceBlockOnIt: [],
    isExplodeable: [],
    blockDrops: {},
    edible: {[Ids.APPLE]: 4},
    itemName: {
        other: id => (Object.keys(Ids).find(i => Ids[i] === id) || "UNKNOWN").split("_").map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(" ")
    },
    entityName: {
        other: id => (Object.keys(EntityIds).find(i => EntityIds[i] === id) || "UNKNOWN").split("_").map(i => i[0].toUpperCase() + i.substring(1).toLowerCase()).join(" ")
    },
    durabilities: {},
    maxStack: {},
    canFall: [],
    canBePlacedOn: {},
    cannotBePlacedOn: {},
    transparent: [],
    canStayOnPhaseables: [],
    step: {},
    dig: {},
    toolType: {},
    toolLevel: {},
    armors: [],
    interactable: [],
    toolTypeItems: {},
    toolLevelItems: {},
    liquid: [],
    liquidCanBreak: []
};