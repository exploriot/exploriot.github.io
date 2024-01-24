import {S_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../../../client/common/metadata/Entities.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {Ids} from "../../../client/common/metadata/Ids.js";

export class S_TNTEntity extends S_Entity {
    fuse = 4;
    explodeRadius = 5;
    damageRadius = 5;
    maxDamage = 13;
    parentEntityId = null;

    constructor(world) {
        super(EntityIds.TNT, world, FALLING_BLOCK_BB);
    };

    update(dt) {
        if ((this.fuse -= dt) <= 0) this.explode();
        if (this.y <= 0) this.remove();
        return super.update(dt);
    };

    explode() {
        if (this.world.gameRules.tntExplodes) {
            for (let x = this.x - this.explodeRadius; x <= this.x + this.explodeRadius; x++) {
                for (let y = this.y - this.explodeRadius; y <= this.y + this.explodeRadius; y++) {
                    const block = this.world.getBlock(x, y);
                    if (this.distance(x, y) <= this.explodeRadius && Metadata.isExplodeable.includes(block[0])) {
                        //if (!block.isTransparent) this.world.addParticle(block.x, block.y, ParticleIds.EXPLOSION, 1.2);
                        if (block[0] === Ids.TNT) {
                            this.world.setBlock(x, y, Ids.AIR);
                            const entity = new S_TNTEntity(this.world);
                            entity.x = x;
                            entity.y = y;
                            entity.parentEntityId = this.parentEntityId;
                            this.world.addEntity(entity);
                        } else {
                            this.world.breakBlock(x, y);
                        } // else if (!this.isTouchingWater) block.break(this);
                    }
                }
            }
            /*for (const entity of this.getViewers()) {
                const dist = this.distance(entity);
                if (dist > this.damageRadius) return;
                entity.attack(new TNTDamage(this, dist));
            }*/
        }
        //this.world.addParticle(this.x, this.y, ParticleIds.EXPLOSION, this.explodeRadius);
        //this.playSound("assets/sounds/random/explode" + rand(1, 4) + ".ogg");
        this.remove();
    };

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy
        };
    };

    static deserialize(world, data) {
        const entity = new S_TNTEntity(world);
        entity.x = data.x;
        entity.y = data.y;
        entity.vx = data.vx;
        entity.vy = data.vy;
        return entity;
    };
}