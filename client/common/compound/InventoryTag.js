import {TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";
import {ObjectTag} from "./ObjectTag.js";
import {Int8Tag} from "./int/Int8Tag.js";
import {ListTag} from "./ListTag.js";
import {Inventory} from "../item/Inventory.js";
import {Item} from "../item/Item.js";
import {ItemTag} from "./ItemTag.js";
import {NullTag} from "./NullTag.js";

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
        const con = this.tags.contents.value;
        for (let i = 0; i < con.length; i++) {
            inv.set(i, Item.deserialize(con[i]));
        }
        return inv;
    };

    apply(inventory) {
        if (!(inventory instanceof Inventory)) {
            if (inventory !== null && typeof inventory === "object") return super.apply(inventory);
            return false;
        }
        this.tags.contents = new ListTag(inventory.getContents().map(i => i ? new ItemTag(i) : new NullTag()));
        super.apply({
            size: inventory.size,
            type: inventory.type
        });
        return true;
    };

    static read(buffer, j, cls = InventoryTag) {
        return ObjectTag.read(buffer, j, cls);
    };
}

TagMatch[TagBytes.INVENTORY] = InventoryTag;