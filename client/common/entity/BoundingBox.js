export class BoundingBox {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    };

    isCollidingWith(bb) {
        if (Array.isArray(bb)) return bb.some(b => this.isCollidingWith(b));
        return bb.x2 > this.x1 && bb.x1 < this.x2 && bb.y1 < this.y2 && bb.y2 > this.y1;
    };

    getCollidingBoxes(boxes) {
        if (!Array.isArray(boxes)) boxes = [boxes];
        return boxes.filter(bb => this.isCollidingWith(bb));
    };

    isCollidingWithTranslated(bb, x, y) {
        if (Array.isArray(bb)) return bb.some(b => this.isCollidingWithTranslated(b, x, y));
        return bb.x2 + x >= this.x1 && bb.x1 + x <= this.x2 && bb.y1 + y <= this.y2 && bb.y2 + y >= this.y1;
    };

    getCollidingBoxesTranslated(boxes, x, y) {
        if (!Array.isArray(boxes)) boxes = [boxes];
        return boxes.filter(bb => this.isCollidingWithTranslated(bb, x, y));
    };

    translateCopy(x, y) {
        return new BoundingBox(
            this.x1 + x,
            this.y1 + y,
            this.x2 + x,
            this.y2 + y
        );
    };

    scaleTranslateCopy(x, y, mx, my) {
        return new BoundingBox(
            this.x1 * mx + x,
            this.y1 * my + y,
            this.x2 * mx + x,
            this.y2 * my + y
        );
    };

    clone() {
        return new BoundingBox(this.x1, this.y1, this.x2, this.y2);
    };
}