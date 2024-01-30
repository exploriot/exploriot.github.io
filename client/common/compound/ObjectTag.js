import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class ObjectTag extends Tag {
    static SIGN = TagBytes.OBJECT;

    /*** @param {Record<string, Tag>} tags */
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

    getTagValue(key) {
        return this.tags[key].value;
    };

    removeTag(key) {
        delete this.tags[key];
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
            buffer[j++] = 1;
            j = this.tags[k].write(buffer, j);
        }
        buffer[j++] = TagBytes.BREAK;
        return j;
    };

    apply(object) {
        if (typeof object !== "object" || object === null) return;
        const keys = Object.keys(this.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (!(k in object)) continue;
            this.tags[k].apply(object[k]);
        }
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
                if (buffer[j] === 1 || buffer[j] === TagBytes.BREAK) break;
                if (j === buffer.length - 1) throw new Error("Unexpected end of object tag's key.");
                key += String.fromCharCode(buffer[j]);
                j++;
            }
            if (buffer[j] === TagBytes.BREAK) break;
            j++;
            const r = Tag.readAny(buffer, j);
            j = r[0];
            tag.tags[key] = r[1];
            if (buffer[j] === TagBytes.BREAK) break;
        }
        return [j + 1, tag];
    };
}

TagMatch[TagBytes.OBJECT] = ObjectTag;