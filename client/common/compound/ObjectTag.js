import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class ObjectTag extends Tag {
    static SIGN = TagBytes.OBJECT;

    /*** @param {Record<string, Tag | ObjectTag | ListTag | StringTag | BoolTag | BaseNumberTag | InventoryTag | ItemTag>} tags */
    constructor(tags = {}) {
        super();
        this.tags = tags;
    };

    get value() {
        const obj = {};
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            obj[k] = this.tags[k].value;
        }
        return obj;
    };

    serialize() {
        const obj = {};
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            obj[k] = this.tags[k].serialize();
        }
        return obj;
    };

    getTag(key) {
        return this.tags[key];
    };

    getTagValue(key) {
        return this.tags[key].value;
    };

    setTag(key, value) {
        this.tags[key] = value;
        return this;
    };

    removeTag(key) {
        delete this.tags[key];
        return this;
    };

    getSize() {
        return 1 + Object.keys(this.tags).reduce((a, b) => a + b.length + 1, 0)
            + Object.values(this.tags).reduce((a, b) => a + b.getSize(), 0) + 1;
    };

    write(buffer, j) {
        buffer[j++] = this.constructor.SIGN;
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            buffer.fill(k, j, j += k.length);
            buffer[j++] = 0;
            j = this.tags[k].write(buffer, j);
        }
        buffer[j++] = TagBytes.BREAK;
        return j;
    };

    apply(object) {
        if (typeof object !== "object" || object === null) return false;
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (!(k in object)) continue;
            this.tags[k].apply(object[k]);
        }
        return true;
    };

    /**
     * @param {Object} target
     * @param {string[]} ignore
     * @return {any}
     */
    applyTo(target, ignore = []) {
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (ignore.includes(k)) continue;
            target[k] = this.tags[k].value;
        }
        return target;
    };

    clone() {
        const tag = new (this.constructor);
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            tag.tags[k] = this.tags[k].clone();
        }
        return tag;
    };

    /*** @param {ObjectTag} objectTag */
    combine(objectTag) {
        Object.assign(this.tags, objectTag.tags);
        return this;
    };

    // noinspection JSCheckFunctionSignatures
    /**
     * @param {Buffer} buffer
     * @param {number} j
     * @param {any} cls
     * @return {[number, ObjectTag]}
     */
    static read(buffer, j, cls = ObjectTag) {
        const tag = new cls;
        while (true) {
            if (j >= buffer.length) throw new Error("Unexpected end of object tag.");
            let key = "";
            while (true) {
                if (buffer[j] === 0 || buffer[j] === TagBytes.BREAK) break;
                if (j === buffer.length - 1) throw new Error("Unexpected end of object tag's key.");
                key += String.fromCharCode(buffer[j]);
                j++;
            }
            if (buffer[j] === TagBytes.BREAK) break;
            j++;
            if (buffer[j] === TagBytes.BREAK) break;
            const r = Tag.readAny(buffer, j);
            j = r[0];
            tag.tags[key] = r[1];
            if (buffer[j] === TagBytes.BREAK) break;
        }
        return [j + 1, tag];
    };
}

TagMatch[TagBytes.OBJECT] = ObjectTag;