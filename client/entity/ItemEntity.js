import {C_Entity} from "./Entity.js";
import {EntityIds, ITEM_BB} from "../common/metadata/Entities.js";
import {getItemTexture} from "../common/metadata/Items.js";
import {ctx} from "../main/Game.js";

export class C_ItemEntity extends C_Entity {
    HAS_RENDER_POS = false;

    pickedUp = false;
    pickedUpTimer = 0.5;
    pickedUpPlayer;

    constructor(id, world, item) {
        super(id, EntityIds.ITEM, world, ITEM_BB);
        this.item = item;
    };

    render() {
        super.render();
        const texture = getItemTexture(this.item.id, this.item.meta);
        this.renderImage(texture.image, ctx);
    };

    update(dt) {
        if (this.pickedUp) {
            if (this.pickedUpPlayer) {
                this.x += (this.pickedUpPlayer.x - this.x) / 10;
                this.y += (this.pickedUpPlayer.y - this.y) / 10;
                if ((this.pickedUpTimer -= dt) <= 0) this.remove();
            }
        } else this.applyGravity(dt);
        return super.update(dt);
    };
}