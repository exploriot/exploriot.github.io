import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 8;

export class Int64Tag extends BaseNumberTag {
    check(num) {
        return typeof num === "bigint" && num >= -(2n ** 63n) && num < (2n ** 63n);
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.INT64;
        buffer.writeBigInt64BE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new Int64Tag(buffer.readBigInt64BE(j))];
    };
}

TagMatch[TagBytes.INT64] = Int64Tag;