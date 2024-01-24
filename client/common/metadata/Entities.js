import {BoundingBox} from "../entity/BoundingBox.js";

export const PLAYER_SPEED = 7;
export const PLAYER_JUMP_ACCELERATION = 6;
export const GRAVITY_FORCE = 20;
export const EMPTY_BB = new BoundingBox(0, 0, 0, 0);
export const PLAYER_BB = new BoundingBox(-0.25, -0.5, 0.25, 1.375);
export const FALLING_BLOCK_BB = new BoundingBox(-0.49, -0.49, 0.49, 0.49);
export const ITEM_BB = new BoundingBox(-0.15, -0.15, 0.15, 0.15);
export const XP_ORB_BB = new BoundingBox(-0.15, -0.15, 0.15, 0.15);
export const SURVIVAL_REACH = 5;
export const CREATIVE_REACH = 10;

export const AttributeIds = {
    GAMEMODE: 0,
    IS_FLYING: 1,
    CAN_FLY: 2,
    HEALTH: 3,
    MAX_HEALTH: 4,
    FOOD: 5,
    MAX_FOOD: 6,
    SATURATION: 7,
    BREATH: 8,
    XP: 9
};

export const EntityIds = {
    PLAYER: 0,
    COW: 1,
    TNT: 2,
    ITEM: 3,
    FALLING_BLOCK: 4,
    XP_ORB: 5
};