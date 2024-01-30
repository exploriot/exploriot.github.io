import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 1;

export class UInt8Tag extends BaseNumberTag {
    check(num) {
        return !isNaN(num) && typeof num === "number" && num === Math.floor(num) && num >= 0 && num <= 255;
    };

    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.UINT8;
        buffer.writeUInt8(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new UInt8Tag(buffer.readUInt8(j))];
    };
}

TagMatch[TagBytes.UINT8] = UInt8Tag;