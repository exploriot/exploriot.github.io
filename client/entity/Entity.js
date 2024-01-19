import {Entity} from "../common/entity/Entity.js";
import {getCanvasPosition} from "../Utils.js";

export class C_Entity extends Entity {
    render(ctx, size) {
    };

    renderImage(image, ctx, size) {
        const pos = getCanvasPosition(this.x, this.y, size);
        const w = (this.baseBB.x2 - this.baseBB.x1) * size;
        const h = (this.baseBB.y2 - this.baseBB.y1) * size;
        ctx.drawImage(
            image,
            pos.x + this.baseBB.x1 * size,
            pos.y - this.baseBB.y2 * size,
            w, h
        );
    };

    renderBoundingBox(ctx, size) {
        const pos = getCanvasPosition(this.x, this.y, size);
        const w = (this.baseBB.x2 - this.baseBB.x1) * size;
        const h = (this.baseBB.y2 - this.baseBB.y1) * size;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
        ctx.strokeRect(
            pos.x + this.baseBB.x1 * size,
            pos.y - this.baseBB.y2 * size,
            w, h
        );
    };
}