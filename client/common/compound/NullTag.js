import {Tag, TagBytes} from "./Tag.js";
import {TagMatch} from "./TagManager.js";

export class NullTag extends Tag {
    value = null;

    getSize() {
        return 1;
    };

    write(buffer, j) {
        buffer[j++] = TagBytes.NULL;
        return j;
    };

    apply(v) {
        return false;
    };

    clone() {
        return new NullTag();
    };

    static read(buffer, j) {
        return [j, new NullTag()];
    };
}

TagMatch[TagBytes.NULL] = NullTag;