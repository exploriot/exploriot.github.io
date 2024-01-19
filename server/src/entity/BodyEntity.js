import {S_Entity} from "./Entity.js";

export class S_BodyEntity extends S_Entity {
    lastX = 0;
    bodyRotation = true; // true means right, false means left

    updateBodyRotation() {
        if (Math.abs(this.x - this.lastX) < 0.0001) return;
        this.bodyRotation = this.x > this.lastX;
        this.lastX = this.x;
    };

    handleMovement() {
        super.handleMovement();
        this.updateBodyRotation();
    };

    getDrops() {
        return [];
    };

    kill() {
        for (const item of this.getDrops()) {
            this.world.dropItem(this.x, this.y, item);
        }
        this.remove();
    };
}