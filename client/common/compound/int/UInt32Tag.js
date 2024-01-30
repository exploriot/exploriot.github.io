import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 4;

export class UInt32Tag extends BaseNumberTag {
    check(num) {
        return !isNaN(num) && typeof num === "number" && num === Math.floor(num) && num >= 0 && num <= 4294967295;
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.UINT32;
        buffer.writeUInt32BE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new UInt32Tag(buffer.readUInt32BE(j))];
    };
}

TagMatch[TagBytes.UINT32] = UInt32Tag;