import {C_Entity} from "./Entity.js";
import {EntityIds, ITEM_BB} from "../common/metadata/Entities.js";
import {getTexture} from "../texture/Texture.js";
import {getItemTexture} from "../common/metadata/Items.js";

export class C_ItemEntity extends C_Entity {
    constructor(id, world, item) {
        super(id, EntityIds.ITEM, world, ITEM_BB);
        this.item = item;
    };

    render(ctx, size) {
        const texture = getItemTexture(this.item.id, this.item.meta);
        this.renderImage(getTexture(texture), ctx, size);
    };

    update(dt) {
        this.applyGravity(dt);
        this.vx *= 0.9;
        return super.update(dt);
    };
}