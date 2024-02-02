import {BoundingBox} from "../entity/BoundingBox.js";

export const PLAYER_SPEED = 7;
export const PLAYER_JUMP_ACCELERATION = 6;
export const GRAVITY_FORCE = 20;
export const EMPTY_BB = new BoundingBox(0, 0, 0, 0);
export const PLAYER_BB = new BoundingBox(-0.25, -0.5, 0.25, 1.375);
export const ZOMBIE_BB = new BoundingBox(-0.25, -0.5, 0.25, 1.375);
export const FALLING_BLOCK_BB = new BoundingBox(-0.49, -0.49, 0.49, 0.49);
export const ITEM_BB = new BoundingBox(-0.15, -0.15, 0.15, 0.15);
export const XP_ORB_BB = new BoundingBox(-0.15, -0.15, 0.15, 0.15);
export const SURVIVAL_REACH = 5;
export const CREATIVE_REACH = 10;

export function getEntityByName(name) {
    return EntityIds[name.toUpperCase()];
}

export function getEntityName(id) {
    const e = Object.keys(EntityIds).find(i => EntityIds[i] === id);
    if (!e) return "Unknown";
    return e.split("_").map(i => i[0] + i.slice(1).toLowerCase()).join(" ");
}

let __id = 0;
const _ = () => __id++;

export const AttributeIds = {
    GAMEMODE: _(),
    IS_FLYING: _(),
    CAN_FLY: _(),
    HEALTH: _(),
    MAX_HEALTH: _(),
    FOOD: _(),
    MAX_FOOD: _(),
    SATURATION: _(),
    BREATH: _(),
    XP: _()
};

export const EntityIds = {
    PLAYER: _(),
    TNT: _(),
    ITEM: _(),
    FALLING_BLOCK: _(),
    XP_ORB: _(),
    ZOMBIE: _()
};