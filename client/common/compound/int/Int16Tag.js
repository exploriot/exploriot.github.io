import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 2;

export class Int16Tag extends BaseNumberTag {
    check(num) {
        return !isNaN(num) && typeof num === "number" && num === Math.floor(num) && num >= -32768 && num <= 32767;
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.INT16;
        buffer.writeInt16BE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new Int16Tag(buffer.readInt16BE(j))];
    };
}

TagMatch[TagBytes.INT16] = Int16Tag;