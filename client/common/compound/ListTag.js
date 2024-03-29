import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class ListTag extends Tag {
    /*** @param {(Tag | ObjectTag | ListTag | StringTag | BoolTag | BaseNumberTag | InventoryTag | ItemTag)[]} tags */
    constructor(tags = []) {
        super();
        this.tags = tags;
    };

    get value() {
        const list = [];
        for (let i = 0; i < this.tags.length; i++) {
            list.push(this.tags[i].value);
        }
        return list;
    };

    getSize() {
        return 1 + this.tags.reduce((a, b) => a + b.getSize(), 0) + 1;
    };

    serialize() {
        const list = [];
        for (let i = 0; i < this.tags.length; i++) {
            list.push(this.tags[i].serialize());
        }
        return list;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.LIST;
        for (let i = 0; i < this.tags.length; i++) {
            j = this.tags[i].write(buffer, j);
        }
        buffer[j++] = TagBytes.BREAK;
        return j;
    };

    apply(list) {
        if (!Array.isArray(list)) return false;
        const len = Math.min(this.tags.length, list.length);
        for (let i = 0; i < len; i++) {
            this.tags[i].apply(list[i]);
        }
        return true;
    };

    clone() {
        const tag = new ListTag;
        for (let i = 0; i < this.tags.length; i++) {
            tag.tags.push(this.tags[i].clone());
        }
        return tag;
    };

    /**
     * @param {Tag} tag
     */
    push(tag) {
        this.tags.push(tag);
    };

    static read(buffer, j) {
        const tag = new ListTag;
        while (true) {
            if (j >= buffer.length) throw new Error("Unexpected end of list tag.");
            if (buffer[j] === TagBytes.BREAK) break;
            const r = Tag.readAny(buffer, j);
            j = r[0];
            tag.tags.push(r[1]);
        }
        return [j + 1, tag];
    };
}

TagMatch[TagBytes.LIST] = ListTag;