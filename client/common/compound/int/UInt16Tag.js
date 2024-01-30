import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 2;

export class UInt16Tag extends BaseNumberTag {
    check(num) {
        return !isNaN(num) && typeof num === "number" && num === Math.floor(num) && num >= 0 && num <= 65535;
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.UINT16;
        buffer.writeUInt16BE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new UInt16Tag(buffer.readUInt16BE(j))];
    };
}

TagMatch[TagBytes.UINT16] = UInt16Tag;