import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class StringTag extends Tag {
    /*** @param {string} value */
    constructor(value) {
        super();
        this.apply(value);
    };

    getSize() {
        return 1 + (this.value.length > 255 ? 4 : 2) + this.value.length;
    };

    write(buffer, j) {
        const len = this.value.length;
        buffer[j++] = len > 255 ? TagBytes.STRING_LONG : TagBytes.STRING;
        if (len > 255) buffer.writeUInt16BE(len, j);
        else buffer.writeUInt8(len, j);
        buffer.fill(this.value, j += len > 255 ? 4 : 2, j += len);
        return j;
    };

    apply(string) {
        if (typeof string !== "string" || string.length > 65535) return this;
        this.value = string;
        return this;
    };

    clone() {
        return new StringTag(this.value);
    };

    static read(buffer, j) {
        const long = buffer[j - 1] === TagBytes.STRING_LONG;
        const length = long ? buffer.readUInt16BE(j) : buffer.readUInt8(j);
        j += long ? 4 : 2;
        // noinspection JSDeprecatedSymbols
        return [j + length, new StringTag(buffer.slice(j, j + length).toString())];
    };
}

TagMatch[TagBytes.STRING] = StringTag;
TagMatch[TagBytes.STRING_LONG] = StringTag;