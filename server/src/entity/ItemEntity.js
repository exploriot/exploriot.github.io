import {S_Entity} from "./Entity.js";
import {EntityIds, ITEM_BB} from "../../../client/common/metadata/Entities.js";
import {Item} from "../../../client/common/item/Item.js";

export class S_ItemEntity extends S_Entity {
    despawnsAt = Date.now() + 1000 * 60 * 0.5;

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
        this.applyGravity(dt);
        this.vx *= 0.9;
        if (this.canBeHoldAfter < Date.now()) for (const player of this.getViewers()) {
            if (player.distance(this.x, this.y) < 0.75) {
                this.remove();
                player.playerInventory.add(this.item);
                player.session.sendInventory();
                return false;
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