import {C_Entity} from "./Entity.js";
import {getBlockTexture} from "../common/metadata/Blocks.js";
import {getTexture} from "../texture/Texture.js";
import {EntityIds, FALLING_BLOCK_BB} from "../common/metadata/Entities.js";
import {getCanvasPosition} from "../Utils.js";

export class C_FallingBlockEntity extends C_Entity {
    constructor(id, world, blockId, blockMeta) {
        super(id, EntityIds.FALLING_BLOCK, world, FALLING_BLOCK_BB);
        this.blockId = blockId;
        this.blockMeta = blockMeta;
    };

    update(dt) {
        this.applyGravity(dt);
        return super.update(dt);
    };

    render(ctx, size) {
        const texture = getBlockTexture(this.blockId, this.blockMeta);
        const pos = getCanvasPosition(this.x - 0.5, this.y + 0.5, size);
        ctx.drawImage(getTexture(texture), pos.x, pos.y, size, size);
    };
}