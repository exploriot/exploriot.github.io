import {S_Entity} from "./Entity.js";
import {EntityIds, ITEM_BB} from "../../../client/common/metadata/Entities.js";
import {Item} from "../../../client/common/item/Item.js";

export class S_ItemEntity extends S_Entity {
    despawnsAt = Date.now() + 1000 * 60 * 5;
    combineTimer = 0;

    constructor(world, item, holdDelay = 500) {
        super(EntityIds.ITEM, world, ITEM_BB);
        this.item = item;
        this.canBeHoldAfter = Date.now() + holdDelay;
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
        if (this.canBeHoldAfter < Date.now()) for (const player of this.getViewers()) {
            if (player.distance(this.x, this.y) < 0.75) {
                player.playerInventory.add(this.item);
                if (this.item.count <= 0) {
                    this.remove();
                    return false;
                }
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
            item: this.item.serialize(),
        };
    };

    static deserialize(world, data) {
        const entity = new S_ItemEntity(world, Item.deserialize(data.item));
        entity.x = data.x;
        entity.y = data.y;
        entity.vx = data.vx;
        entity.vy = data.vy;
        return entity;
    };
}