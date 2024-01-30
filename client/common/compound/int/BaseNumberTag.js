import {Tag} from "../Tag.js";

export class BaseNumberTag extends Tag {
    /*** @param {number} value */
    constructor(value) {
        super();
        this.apply(value);
    };

    check(num) {
        return !isNaN(num) && typeof num === "number";
    };

    apply(num) {
        if (!this.check(num)) return;
        this.value = num;
    };

    clone() {
        return new (this.constructor)(this.value);
    };
}