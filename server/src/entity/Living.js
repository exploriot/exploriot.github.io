import {S_Entity} from "./Entity.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {randInt} from "../../../client/common/Utils.js";
import {GameRules} from "../../../client/common/metadata/GameRules.js";

/**
 * @property {number} fallY
 * @property {number} voidTicks
 */
export class S_Living extends S_Entity {
    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        fallY: new Float32Tag(0),
        voidTicks: new Float32Tag(0)
    }).combine(S_Entity.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = S_Entity.NBT_PUBLIC_STRUCTURE;

    update(dt) {
        if (this.y < -64) {
            if ((this.voidTicks += dt) >= 0.5) {
                this.damage(4);
                this.voidTicks = 0;
            }
        } else this.voidTicks = 0;

        const isOnGround = this.isOnGround();
        const isFlying = this.isFlying();
        if (isOnGround) {
            this.onFall(this.fallY - this.y);
            this.fallY = this.y;
        } else if (isFlying) {
            this.fallY = this.y;
        } else {
            if (this.y > this.fallY) this.fallY = this.y;
        }

        return super.update(dt);
    };

    teleport(x, y) {
        this.fallY = y;
        super.teleport(x, y);
    };

    getHealth() {
        return this.health;
    };

    setHealth(hp) {
        this.health = hp;
    };

    damage(hp) {
        const newHealth = this.getHealth() - hp;
        this.setHealth(newHealth);
        this.world.playSound("assets/sounds/damage/hit" + randInt(1, 3) + ".ogg", this.x, this.y);
        if (newHealth <= 0) this.kill();
    };

    getDrops() {
        return [];
    };

    onFall(fallDistance) {
        if (fallDistance < 3.5 || !this.world.getGameRule(GameRules.FALL_DAMAGE) || this.isTouchingWater()) return;
        this.damage(fallDistance - 3);
        this.world.playSound("assets/sounds/damage/fall" + (fallDistance > 8 ? "big" : "small") + ".ogg", this.x, this.y);
    };

    remove(kill = true) {
        for (const item of this.getDrops()) {
            this.world.dropItem(this.x, this.y, item);
        }
        super.remove();
    };
}