import {S_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../../../client/common/metadata/Entities.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {GameRules} from "../../../client/common/metadata/GameRules.js";
import {Item} from "../../../client/common/item/Item.js";
import {randFloat, randInt} from "../../../client/common/Utils.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import {ParticleIds} from "../../../client/common/metadata/ParticleIds.js";

/**
 * @property {number} fuse
 * @property {number} explodeRadius
 * @property {number} damageRadius
 * @property {number} maxDamage
 * @property {string} parentEntityUUID
 */
export class S_TNTEntity extends S_Entity {
    static TYPE = EntityIds.TNT;
    static BOUNDING_BOX = FALLING_BLOCK_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        fuse: new Float32Tag(3),
        explodeRadius: new Float32Tag(5),
        damageRadius: new Float32Tag(5),
        maxDamage: new Float32Tag(13),
        parentEntityUUID: new StringTag("")
    }).combine(S_Entity.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = S_Entity.NBT_PUBLIC_STRUCTURE;

    update(dt) {
        if ((this.fuse -= dt) <= 0) this.explode();
        if (this.y <= 0) this.remove();
        return super.update(dt);
    };

    explode() {
        const item = new Item(Ids.DIAMOND_PICKAXE);
        if (this.world.getGameRule(GameRules.TNT_EXPLODES)) {
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
                            entity.fuse = randFloat(0.5, 1.5);
                            entity.parentEntityUUID = this.parentEntityUUID;
                            this.world.addEntity(entity);
                        } else { // todo: check if it's touching water
                            this.world.breakBlock(x, y, item);
                        }
                    }
                }
            }
            for (const entity of this.getViewers()) {
                const dist = this.distance(entity);
                if (dist > this.damageRadius) return;
                entity.attack(this.damageRadius - dist);
            }
        }
        this.world.addParticle(ParticleIds.EXPLOSION, this.x, this.y, {radius: this.explodeRadius});
        this.world.playSound("assets/sounds/random/explode" + randInt(1, 4) + ".ogg");
        this.remove();
    };
}