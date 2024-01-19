import {S_Entity} from "./Entity.js";
import {EntityIds, FALLING_BLOCK_BB} from "../../../client/common/metadata/Entities.js";
import {Item} from "../../../client/common/item/Item.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";

export class S_FallingBlockEntity extends S_Entity {
    constructor(world, blockId, blockMeta) {
        super(EntityIds.FALLING_BLOCK, world, FALLING_BLOCK_BB);
        this.blockId = blockId;
        this.blockMeta = blockMeta;
    };

    update(dt) {
        this.applyGravity(dt);
        if (this.isOnGround()) {
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

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            blockId: this.blockId,
            blockMeta: this.blockMeta
        };
    };

    static deserialize(world, data) {
        const entity = new S_FallingBlockEntity(world, data.blockId, data.blockMeta);
        entity.x = data.x;
        entity.y = data.y;
        entity.vx = data.vx;
        entity.vy = data.vy;
        return entity;
    };
}