import {TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";
import {ObjectTag} from "./ObjectTag.js";
import {Int8Tag} from "./int/Int8Tag.js";
import {ListTag} from "./ListTag.js";
import {Inventory} from "../item/Inventory.js";
import {Item} from "../item/Item.js";
import {Ids} from "../metadata/Ids.js";
import {ItemTag} from "./ItemTag.js";

export class InventoryTag extends ObjectTag {
    static SIGN = TagBytes.INVENTORY;

    tags = {
        size: new Int8Tag(0),
        type: new Int8Tag(0),
        contents: new ListTag
    };

    /*** @param {Inventory | null} value */
    constructor(value) {
        super();
        this.apply(value);
    };

    serialize() {
        return super.serialize();
    }

    // noinspection JSCheckFunctionSignatures
    get value() {
        const inv = new Inventory(this.tags.size.value, this.tags.type.value);
        inv.contents = this.tags.contents.value.map(Item.deserialize);
        return inv;
    };

    apply(inventory) {
        if (!(inventory instanceof Inventory)) {
            if (inventory !== null && typeof inventory === "object") {
                super.apply(inventory);
            }
            return this;
        }
        super.apply({
            size: inventory.size,
            type: inventory.type
        });
        this.tags.contents = new ListTag(inventory.contents.map(i => new ItemTag(i ?? new Item(Ids.AIR))));
        return this;
    };

    static read(buffer, j, cls = InventoryTag) {
        return ObjectTag.read(buffer, j, cls);
    };
}

TagMatch[TagBytes.INVENTORY] = InventoryTag;