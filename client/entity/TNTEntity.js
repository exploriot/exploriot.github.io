import {C_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../common/metadata/Entities.js";
import {getBlockTexture} from "../common/metadata/Blocks.js";
import {Texture} from "../loader/Texture.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {Ids} from "../common/metadata/Ids.js";

export class C_TNTEntity extends C_Entity {
    aliveTime = 0;

    constructor(id, world, item) {
        super(id, EntityIds.ITEM, world, FALLING_BLOCK_BB);
        this.item = item;
    };

    render(ctx) {
        if (this.aliveTime % 1 > 0.5) {
            const pos = getCanvasPosition(this.x - 0.5, this.y + 0.5);
            ctx.fillStyle = "white";
            ctx.fillRect(pos.x, pos.y, BASE_BLOCK_SIZE, BASE_BLOCK_SIZE);
        } else {
            const texture = getBlockTexture(Ids.TNT, 0);
            const pos = getCanvasPosition(this.x - 0.5, this.y + 0.5);
            ctx.drawImage(Texture.get(texture).image, pos.x, pos.y, BASE_BLOCK_SIZE, BASE_BLOCK_SIZE);
        }
    };

    update(dt) {
        this.aliveTime += dt;
        this.applyGravity(dt);
        return super.update(dt);
    };
}