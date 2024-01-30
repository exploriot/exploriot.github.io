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

    // noinspection JSCheckFunctionSignatures
    get value() {
        const obj = super.value;
        const inv = new Inventory(obj.size, obj.type);
        inv.contents = obj.contents.map(Item.deserialize);
        return inv;
    };

    apply(inventory) {
        if (!(inventory instanceof Inventory)) return;
        super.apply({
            size: inventory.size,
            type: inventory.type
        });
        this.tags.contents = new ListTag(inventory.contents.map(i => new ItemTag(i ?? new Item(Ids.AIR))));
    };

    static read(buffer, j, cls = InventoryTag) {
        return ObjectTag.read(buffer, j, cls);
    };
}

TagMatch[TagBytes.INVENTORY] = InventoryTag;