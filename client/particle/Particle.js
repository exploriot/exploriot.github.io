export class Particle {
    constructor(type, x, y, extra) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.extra = extra;
        this.endsAt = Date.now() + this.getDuration();
    };

    canDespawn() {
        return this.endsAt <= Date.now();
    };

    getDuration() {
        return 0;
    };

    render() {
    };
}