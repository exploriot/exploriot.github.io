import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 1;

export class Int8Tag extends BaseNumberTag {
    check(num) {
        return !isNaN(num) && typeof num === "number" && num === Math.floor(num) && num >= -128 && num <= 127;
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.INT8;
        buffer.writeInt8(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new Int8Tag(buffer.readInt8(j))];
    };
}

TagMatch[TagBytes.INT8] = Int8Tag;