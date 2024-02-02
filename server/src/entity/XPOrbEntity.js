import {S_Entity} from "./Entity.js";
import {EntityIds, XP_ORB_BB} from "../../../client/common/metadata/Entities.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {EntityAnimationPacket} from "../packet/EntityAnimationPacket.js";
import {AnimationIds} from "../../../client/common/metadata/AnimationIds.js";
import {getLevelFromXP} from "../../../client/common/Utils.js";
import {BoolTag} from "../../../client/common/compound/BoolTag.js";

/**
 * @property {number} despawnTimer
 * @property {number} size
 * @property {number} combineTimer
 * @property {boolean} pickedUp
 */
export class S_XPOrbEntity extends S_Entity {
    static TYPE = EntityIds.XP_ORB;
    static BOUNDING_BOX = XP_ORB_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        despawnTimer: new Float32Tag(1000 * 60 * 5),
        combineTimer: new Float32Tag(0),
        size: new Float32Tag(1),
        pickedUp: new BoolTag(false)
    }).combine(S_Entity.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        size: new Float32Tag(1)
    }).combine(S_Entity.NBT_PUBLIC_STRUCTURE);

    targetPlayer;
    targetChange = 3;

    update(dt) {
        if (this.y < -64 || (this.despawnTimer -= dt) <= 0) {
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
        for (const player of this.currentViewers) {
            if (player.getGamemode() === 3) continue;
            if (player.distance(this.x, this.y) < 1.4) {
                const xpBef = player.getXP();
                const levelBef = Math.floor(getLevelFromXP(xpBef));
                const levelAft = Math.floor(getLevelFromXP(xpBef + this.size));
                player.setXP(xpBef + this.size);
                this.pickedUp = true;
                this.remove();
                this.world.playSound("assets/sounds/random/" + (levelBef === levelAft ? "orb" : "levelup") + ".ogg", this.x, this.y);
                this.broadcastPacketToViewers(EntityAnimationPacket(this.id, AnimationIds.PICKUP, {
                    playerId: player.id
                }))
                return false;
            }
        }
        if ((this.targetChange += dt) >= 3) {
            this.targetChange = 0;
            this.targetPlayer = this.findClosestPlayer();
        }
        if (this.targetPlayer) {
            this.move(this.targetPlayer.x < this.x ? -0.01 : 0.01, 0);
            this.broadcastMovement();
        }
        return super.update(dt);
    };

    broadcastDespawn() {
        if (this.pickedUp) return;
        super.broadcastDespawn();
    };
}