export class BoundingBox {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    };

    isCollidingWithBlockCoordinate(x, y) {
        const blockLeft = x - 0.5;
        const blockRight = x + 0.5;
        const blockBottom = y - 0.5;
        const blockTop = y + 0.5;
        return blockRight >= this.x1 && blockLeft <= this.x2 && blockBottom <= this.y2 && blockTop >= this.y1;
    };

    isCollidingWith(bb) {
        return bb.x2 >= this.x2 && bb.x1 <= this.x2 && bb.y1 <= this.y2 && bb.y2 >= this.y1;
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