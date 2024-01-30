import {S_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../../../client/common/metadata/Entities.js";
import {Item} from "../../../client/common/item/Item.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {S_Living} from "./Living.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {Int8Tag} from "../../../client/common/compound/int/Int8Tag.js";

/**
 * @property {number} fallY
 * @property {number} blockId
 * @property {number} blockMeta
 */
export class S_FallingBlockEntity extends S_Entity {
    static TYPE = EntityIds.FALLING_BLOCK;
    static BOUNDING_BOX = FALLING_BLOCK_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        fallY: new Float32Tag(0),
        blockId: new Int8Tag(0),
        blockMeta: new Int8Tag(0)
    }).combine(S_Entity.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        blockId: new Int8Tag(0),
        blockMeta: new Int8Tag(0)
    }).combine(S_Entity.NBT_PUBLIC_STRUCTURE);

    update(dt) {
        if (this.fallY === 0) this.fallY = this.y;
        this.applyGravity(dt);
        if (this.isOnGround()) {
            if (this.blockId === Ids.ANVIL) {
                const fell = this.fallY - this.y;
                if (fell > 1) {
                    const dmg = Math.min(20, fell - 1);
                    if (dmg > 0) for (const entity of this.getViewers()) {
                        if (entity instanceof S_Living && entity.bb.isCollidingWith(this.bb)) entity.damage(dmg);
                    }
                    if (Math.random() < 0.05 * fell) {
                        this.blockMeta++;
                        if (this.blockMeta > 2) return this.remove();
                    }
                }
            }
            this.remove();
            const existing = this.world.getBlock(this.x, this.y);
            if (!Metadata.replaceable.includes(existing[0])) {
                this.world.dropItem(this.x, this.y, new Item(this.blockId, this.blockMeta));
                return false;
            }
            this.world.setBlock(Math.round(this.x), Math.round(this.y), this.blockId, this.blockMeta);
            return false;
        }
        return super.update(dt);
    };
}