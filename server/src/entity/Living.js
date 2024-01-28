import {S_Entity} from "./Entity.js";

export class S_Living extends S_Entity {
    voidTicks = 0;

    update(dt) {
        if (this.y < -64) {
            if ((this.voidTicks += dt) >= 0.5) {
                this.damage(4);
                this.voidTicks = 0;
            }
        } else this.voidTicks = 0;
        return super.update(dt);
    };

    damage(hp) {
    };

    getDrops() {
        return [];
    };

    remove(kill = true) {
        for (const item of this.getDrops()) {
            this.world.dropItem(this.x, this.y, item);
        }
        super.remove();
    };
}