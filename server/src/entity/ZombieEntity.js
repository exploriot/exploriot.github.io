import {EntityIds, ZOMBIE_BB} from "../../../client/common/metadata/Entities.js";
import {S_Living} from "./Living.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";

/**
 * @property {number} health
 */
export class S_ZombieEntity extends S_Living {
    static TYPE = EntityIds.ZOMBIE;
    static BOUNDING_BOX = ZOMBIE_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        health: new Float32Tag(20)
    }).combine(S_Living.NBT_PRIVATE_STRUCTURE);

    targetPlayer;
    targetChange = 3;
    hitTimer = 0;
    eyeHeight = 1.5;

    update(dt) {
        if (this.y < -64 || this.currentViewers.size === 0) {
            this.remove();
            return false;
        }
        this.applyGravity(dt);
        if ((this.targetChange += dt) >= 1) {
            this.targetChange = 0;
            this.targetPlayer = this.findClosestPlayer([0, 2]);
        }
        const target = this.targetPlayer;
        if (target) {
            this.move(target.x < this.x ? -0.02 : 0.02, 0);
            if (this.distance(target.x, target.y) < 1.5 && (this.hitTimer -= dt) <= 0) {
                this.hitTimer = 1;
                target.damage(3);
                target.knockFrom(this.x);
            }
            this.broadcastMovement();
        }
        return super.update(dt);
    };
}