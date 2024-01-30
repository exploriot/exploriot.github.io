import {S_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../../../client/common/metadata/Entities.js";
import {EntityAnimationPacket} from "../packet/EntityAnimationPacket.js";
import {AnimationIds} from "../../../client/common/metadata/AnimationIds.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {BoolTag} from "../../../client/common/compound/BoolTag.js";
import {ItemTag} from "../../../client/common/compound/ItemTag.js";
import {Item} from "../../../client/common/item/Item.js";
import {Ids} from "../../../client/common/metadata/Ids.js";

/**
 * @property {Item} item
 * @property {number} despawnTimer
 * @property {number} combineTimer
 * @property {number} holdTimer
 * @property {boolean} pickedUp
 */
export class S_ItemEntity extends S_Entity {
    static TYPE = EntityIds.FALLING_BLOCK;
    static BOUNDING_BOX = FALLING_BLOCK_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        item: new ItemTag(new Item(Ids.AIR)),
        despawnTimer: new Float32Tag(1000 * 60 * 5),
        combineTimer: new Float32Tag(0),
        holdTimer: new Float32Tag(0),
        pickedUp: new BoolTag(false)
    }).combine(S_Entity.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        item: new ItemTag(new Item(Ids.AIR))
    }).combine(S_Entity.NBT_PUBLIC_STRUCTURE);

    update(dt) {
        if ((this.despawnTimer -= dt) <= 0) {
            this.despawnTimer = 0;
            this.remove();
            return false;
        }
        this.combineTimer += dt;
        if (this.combineTimer > 1) {
            this.combineTimer = 0;
            for (const entity of this.world.getChunkEntities(this.x >> 4)) if (
                entity instanceof S_ItemEntity
                && entity !== this
                && entity.distance(this.x, this.y) < 2
                && entity.item.equals(this.item, false, true)
            ) {
                this.item.count += entity.item.count;
                entity.remove();
                return false;
            }
        }
        this.applyGravity(dt);
        this.vx *= 0.9;
        if ((this.holdTimer -= dt) <= 0) for (const player of this.getPlayerViewers()) {
            this.holdTimer = 0;
            if (player.distance(this.x, this.y) < 0.75) {
                player.playerInventory.add(this.item);
                if (this.item.count <= 0) {
                    this.pickedUp = true;
                    this.remove();
                    this.world.playSound("./assets/sounds/random/pop.ogg", this.x, this.y);
                    this.broadcastPacketToViewers(EntityAnimationPacket(this.id, AnimationIds.ITEM_PICKUP, {
                        playerId: player.id
                    }))
                    return false;
                }
            }
        }
        return super.update(dt);
    };

    broadcastDespawn() {
        if (this.pickedUp) return;
        super.broadcastDespawn();
    };
}