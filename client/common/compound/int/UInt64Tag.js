import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 8;

export class UInt64Tag extends BaseNumberTag {
    check(num) {
        return typeof num === "bigint" && num >= 0 && num <= (2n ** 64n);
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.UINT64;
        buffer.writeBigUInt64BE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new UInt64Tag(buffer.readBigUInt64BE(j))];
    };
}

TagMatch[TagBytes.UINT64] = UInt64Tag;