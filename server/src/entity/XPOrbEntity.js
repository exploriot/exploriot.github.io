import {S_Entity} from "./Entity.js";
import {EntityIds, XP_ORB_BB} from "../../../client/common/metadata/Entities.js";

export class S_XPOrbEntity extends S_Entity {
    size = 1;
    despawnsAt = Date.now() + 1000 * 60 * 5;
    combineTimer = 0;

    constructor(world, size) {
        super(EntityIds.XP_ORB, world, XP_ORB_BB);
        this.size = size;
    };

    update(dt) {
        if (this.despawnsAt < Date.now()) {
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
        for (const player of this.getViewers()) {
            if (player.distance(this.x, this.y) < 0.75) {
                player.setXP(player.getXP() + this.size);
                this.remove();
            }
        }
        return super.update(dt);
    };

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            size: this.size
        };
    };

    static deserialize(world, data) {
        const entity = new S_XPOrbEntity(world, data.size);
        entity.x = data.x;
        entity.y = data.y;
        entity.vx = data.vx;
        entity.vy = data.vy;
        return entity;
    };
}