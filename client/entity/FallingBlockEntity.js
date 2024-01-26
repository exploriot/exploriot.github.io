import {C_Entity} from "./Entity.js";
import {getBlockTexture} from "../common/metadata/Blocks.js";
import {EntityIds, FALLING_BLOCK_BB} from "../common/metadata/Entities.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {Texture} from "../loader/Texture.js";

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

    render(ctx) {
        const texture = getBlockTexture(this.blockId, this.blockMeta);
        const pos = getCanvasPosition(this.x - 0.5, this.y + 0.5);
        ctx.drawImage(Texture.get(texture).image, pos.x, pos.y, BASE_BLOCK_SIZE, BASE_BLOCK_SIZE);
    };
}