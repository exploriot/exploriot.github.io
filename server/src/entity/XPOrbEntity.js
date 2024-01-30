import {S_Entity} from "./Entity.js";
import {EntityIds, XP_ORB_BB} from "../../../client/common/metadata/Entities.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";

/**
 * @property {number} despawnTimer
 * @property {number} size
 * @property {number} combineTimer
 */
export class S_XPOrbEntity extends S_Entity {
    static TYPE = EntityIds.XP_ORB;
    static BOUNDING_BOX = XP_ORB_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        despawnTimer: new Float32Tag(1000 * 60 * 5),
        combineTimer: new Float32Tag(0),
        size: new Float32Tag(1)
    }).combine(S_Entity.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        size: new Float32Tag(1)
    }).combine(S_Entity.NBT_PUBLIC_STRUCTURE);

    update(dt) {
        if ((this.despawnTimer -= dt) <= 0) {
            this.remove();
            return false;
        }
        this.combineTimer += dt;
        if (this.combineTimer > 1) {
            this.combineTimer = 0;
            for (const entity of this.world.getChunkEntities(this.x >> 4)) if (
                entity instanceof S_XPOrbEntity
                && entity !== this
                && entity.distance(this.x, this.y) < 2
            ) {
                this.size += entity.size;
                entity.remove();
                return false;
            }
        }
        this.applyGravity(dt);
        this.vx *= 0.9;
        for (const player of this.currentViewers) {
            if (player.distance(this.x, this.y) < 0.75) {
                player.setXP(player.getXP() + this.size);
                this.remove();
            }
        }
        return super.update(dt);
    };
}