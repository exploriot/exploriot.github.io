import {C_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../common/metadata/Entities.js";
import {getBlockTexture} from "../common/metadata/Blocks.js";
import {getTexture} from "../texture/Texture.js";
import {getCanvasPosition} from "../Utils.js";
import {Ids} from "../common/metadata/Ids.js";

export class C_TNTEntity extends C_Entity {
    constructor(id, world, item) {
        super(id, EntityIds.ITEM, world, FALLING_BLOCK_BB);
        this.item = item;
    };

    render(ctx, size) {
        const texture = getBlockTexture(Ids.TNT, 0);
        const pos = getCanvasPosition(this.x - 0.5, this.y + 0.5, size);
        ctx.drawImage(getTexture(texture), pos.x, pos.y, size, size);
    };

    update(dt) {
        this.applyGravity(dt);
        return super.update(dt);
    };
}