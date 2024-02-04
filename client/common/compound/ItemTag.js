import {TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";
import {Item} from "../item/Item.js";
import {ObjectTag} from "./ObjectTag.js";
import {Int8Tag} from "./int/Int8Tag.js";
import {StringTag} from "./StringTag.js";

export class ItemTag extends ObjectTag {
    static SIGN = TagBytes.ITEM;

    tags = {
        id: new Int8Tag(0),
        meta: new Int8Tag(0),
        count: new Int8Tag(0),
        nbt: new StringTag("{}") // todo: make nbt fixed, somehow.
    };

    /*** @param {Item | null} value */
    constructor(value) {
        super();
        this.apply(value);
    };

    // noinspection JSCheckFunctionSignatures
    get value() {
        const obj = super.value;
        return new Item(obj.id, obj.meta, obj.count, JSON.parse(obj.nbt));
    };

    apply(item) {
        if (!(item instanceof Item)) {
            if (item !== null && typeof item === "object") return super.apply(item);
            return false;
        }
        return super.apply({
            id: item.id,
            meta: item.meta,
            count: item.count,
            nbt: JSON.stringify(item.nbt)
        });
    };

    static read(buffer, j, cls = ItemTag) {
        return ObjectTag.read(buffer, j, cls);
    };
}

TagMatch[TagBytes.ITEM] = ItemTag;