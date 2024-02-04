import {Entity, ENTITY_DOWN_Y} from "../common/entity/Entity.js";
import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {ctx} from "../main/Game.js";

export class C_Entity extends Entity {
    renderX = 0;
    renderY = 0;

    recalculateBoundingBox() {
        if (!this.HAS_RENDER_POS) return super.recalculateBoundingBox();
        this.bb.x1 = this.renderX + this.baseBB.x1;
        this.bb.y1 = this.renderY + this.baseBB.y1;
        this.bb.x2 = this.renderX + this.baseBB.x2;
        this.bb.y2 = this.renderY + this.baseBB.y2;

        this.downBB.x1 = this.bb.x1;
        this.downBB.y1 = this.bb.y1 - ENTITY_DOWN_Y - ENTITY_DOWN_Y;
        this.downBB.x2 = this.bb.x2;
        this.downBB.y2 = this.bb.y1 - ENTITY_DOWN_Y;
    };

    render() {
        if (this.HAS_RENDER_POS) {
            const dx = (this.x - this.renderX) / 5;
            const dy = (this.y - this.renderY) / 5;
            this.renderX += dx;
            this.renderY += dy;
        } else {
            this.renderX = this.x;
            this.renderY = this.y;
        }
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

    renderBoundingBox() {
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