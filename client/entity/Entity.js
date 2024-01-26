import {Entity} from "../common/entity/Entity.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";

export class C_Entity extends Entity {
    render(ctx) {
    };

    renderImage(image, ctx) {
        const pos = getCanvasPosition(this.renderX ?? this.x, this.renderY ?? this.y);
        const w = (this.baseBB.x2 - this.baseBB.x1) * BASE_BLOCK_SIZE;
        const h = (this.baseBB.y2 - this.baseBB.y1) * BASE_BLOCK_SIZE;
        ctx.drawImage(
            image,
            pos.x + this.baseBB.x1 * BASE_BLOCK_SIZE,
            pos.y - this.baseBB.y2 * BASE_BLOCK_SIZE,
            w, h
        );
    };

    renderBoundingBox(ctx) {
        const pos = getCanvasPosition(this.x, this.y);
        const w = (this.baseBB.x2 - this.baseBB.x1) * BASE_BLOCK_SIZE;
        const h = (this.baseBB.y2 - this.baseBB.y1) * BASE_BLOCK_SIZE;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
        ctx.strokeRect(
            pos.x + this.baseBB.x1 * BASE_BLOCK_SIZE,
            pos.y - this.baseBB.y2 * BASE_BLOCK_SIZE,
            w, h
        );
    };
}