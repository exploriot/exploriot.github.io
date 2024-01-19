import {BoundingBox} from "../entity/BoundingBox.js";

export const PLAYER_SPEED = 7;
export const PLAYER_JUMP_ACCELERATION = 6;
export const GRAVITY_FORCE = 20;
export const PLAYER_BB = new BoundingBox(-0.25, -0.5, 0.25, 1.375);
export const FALLING_BLOCK_BB = new BoundingBox(-0.49, -0.49, 0.49, 0.49);
export const ITEM_BB = new BoundingBox(-0.15, -0.15, 0.15, 0.15);
export const SURVIVAL_REACH = 5;
export const CREATIVE_REACH = 10;

export const EntityIds = {
    NOTHING: 0, PLAYER: 1, COW: 2, TNT: 3, ITEM: 4, FALLING_BLOCK: 5
};