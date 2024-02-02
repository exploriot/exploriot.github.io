import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class BoolTag extends Tag {
    constructor(value) {
        super();
        this.apply(value);
    };

    getSize() {
        return 1;
    };

    write(buffer, j) {
        buffer[j++] = this.value ? TagBytes.TRUE : TagBytes.FALSE;
        return j;
    };

    apply(bool) {
        if (typeof bool !== "boolean") return this;
        this.value = bool;
        return this;
    };

    clone() {
        return new BoolTag(this.value);
    };

    static read(buffer, j) {
        return [j, new BoolTag(buffer[j - 1] === TagBytes.TRUE)];
    };
}

TagMatch[TagBytes.TRUE] = BoolTag;
TagMatch[TagBytes.FALSE] = BoolTag;