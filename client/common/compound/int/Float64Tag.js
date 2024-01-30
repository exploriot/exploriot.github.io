import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 8;

export class Float64Tag extends BaseNumberTag {
    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.FLOAT64;
        buffer.writeDoubleBE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new Float64Tag(buffer.readDoubleBE(j))];
    };
}

TagMatch[TagBytes.FLOAT64] = Float64Tag;