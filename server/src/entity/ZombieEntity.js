import {EntityIds, ZOMBIE_BB} from "../../../client/common/metadata/Entities.js";
import {S_Living} from "./Living.js";

export class S_ZombieEntity extends S_Living {
    static TYPE = EntityIds.ZOMBIE;
    static BOUNDING_BOX = ZOMBIE_BB;

    targetPlayer;
    targetChange = 3;

    update(dt) {
        if (this.y < -64 || this.currentViewers.size === 0) {
            this.remove();
            return false;
        }
        this.applyGravity(dt);
        if ((this.targetChange += dt) >= 3) {
            this.targetChange = 0;
            this.targetPlayer = this.findClosestPlayer();
        }
        if (this.targetPlayer) {
            this.move(this.targetPlayer.x < this.x ? -0.02 : 0.02, 0);
            this.broadcastMovement();
        }
        return super.update(dt);
    };
}