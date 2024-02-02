import {TagMatch} from "./TagManager.js";

export const TagBytes = {
    BREAK: 255,
    OBJECT: 1,
    LIST: 2,
    TRUE: 3,
    FALSE: 4,
    BOOL: 3,
    INT8: 5,
    CHAR: 5,
    INT16: 6,
    INT32: 7,
    INT64: 8,
    FLOAT32: 9,
    FLOAT64: 10,
    UINT8: 11,
    UINT16: 12,
    UINT32: 13,
    UINT64: 14,
    STRING: 15,
    STRING_LONG: 16,
    ITEM: 17,
    INVENTORY: 18,
    LEGACY_STRING: 19
};

/*** @property {any} value */
export class Tag {
    getSize() {
        return 0;
    };

    serialize() {
        return this.value;
    };

    /**
     * @param {Buffer} buffer
     * @param {number} j
     * @return {number}
     */
    write(buffer, j) {
        return j;
    };

    toBuffer() {
        const buffer = Buffer.alloc(this.getSize());
        this.write(buffer, 0);
        return buffer;
    };

    /*** @param {any} any */
    apply(any) {
        this.value = any;
        return this;
    };

    /*** @return {this} */
    clone() {
        return null;
    };

    // noinspection JSUnusedLocalSymbols
    /**
     * @param {Buffer} buffer
     * @param {number} j
     * @returns {[number, this]}
     */
    static read(buffer, j) {
        throw new Error("Invalid operation.");
    }

    /**
     * @param {Buffer} buffer
     * @param {number} j
     * @return {[number, Tag | ObjectTag | ListTag | StringTag | BoolTag | BaseNumberTag | InventoryTag | ItemTag]}
     */
    static readAny(buffer, j) {
        return TagMatch[buffer[j++]].read(buffer, j);
    };
}