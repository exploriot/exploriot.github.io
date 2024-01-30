import {TagBytes} from "../Tag.js";
import {TagMatch} from "../TagManager.js";
import {BaseNumberTag} from "./BaseNumberTag.js";

const SIZE = 4;

export class Float32Tag extends BaseNumberTag {
    getSize() {
        return 1 + SIZE;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.FLOAT32;
        buffer.writeFloatBE(this.value, j);
        return j + SIZE;
    };

    static read(buffer, j) {
        return [j + SIZE, new Float32Tag(buffer.readFloatBE(j))];
    };
}

TagMatch[TagBytes.FLOAT32] = Float32Tag;