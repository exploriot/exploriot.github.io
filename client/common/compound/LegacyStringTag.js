import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class LegacyStringTag extends Tag {
    /*** @param {string} value */
    constructor(value) {
        super();
        this.apply(value);
    };

    getSize() {
        return 1 + this.value.length + 1;
    };

    write(buffer, j) {
        const len = this.value.length;
        buffer[j++] = TagBytes.STRING;
        buffer.fill(this.value, j, j += len);
        buffer[j] = 1;
        return j + 1;
    };

    apply(string) {
        if (typeof string !== "string" || string.length > 65535) return this;
        this.value = string.replaceAll("\x01", "");
        return this;
    };

    clone() {
        return new LegacyStringTag(this.value);
    };

    static read(buffer, j) {
        let string = "";
        if (j >= buffer.length) throw new Error("Unexpected end of string tag.");
        while (true) {
            if (buffer[j] === 1) break;
            if (j === buffer.length - 1) throw new Error("Unexpected end of string tag.");
            string += String.fromCharCode(buffer[j]);
            j++;
        }
        return [j + 1, new LegacyStringTag(string)];
    };
}

TagMatch[TagBytes.LEGACY_STRING] = LegacyStringTag;