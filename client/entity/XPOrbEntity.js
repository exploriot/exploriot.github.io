import {C_Entity} from "./Entity.js";
import {EntityIds, XP_ORB_BB} from "../common/metadata/Entities.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {Texture} from "../loader/Texture.js";

export const XP_ORB_TEXTURE_PATH = "assets/entities/xp_orb.png";

export class C_XPOrbEntity extends C_Entity {
    constructor(id, world, size) {
        super(id, EntityIds.XP_ORB, world, XP_ORB_BB);
        this.size = size;
    };

    render(ctx) {
        const pos = getCanvasPosition(this.x, this.y);
        ctx.drawImage(Texture.get(XP_ORB_TEXTURE_PATH).image, pos.x, pos.y, BASE_BLOCK_SIZE * 0.2, BASE_BLOCK_SIZE * 0.2);
    };

    update(dt) {
        this.applyGravity(dt);
        this.vx *= 0.9;
        return super.update(dt);
    };
}