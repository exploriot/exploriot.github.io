import {getItemMaxStack} from "../metadata/Items.js";
import {Item} from "./Item.js";

export const InventoryIds = {
    PLAYER: 0,
    CURSOR: 1,
    CRAFT: 2,
    ARMOR: 3,
    EXTERNAL: 4,
    __LEN: 5
};

export const ContainerIds = {
    CRAFTING_TABLE: 0,
    __LEN: 1
};

export class Inventory {
    /**
     * @param {number} size
     * @param {Set} dirty
     */
    constructor(size, dirty = new Set) {
        this.size = size;
        this.dirty = dirty;
        /*** @type {(Item | null)[]} */
        this.contents = new Array(size).fill(null);
    };

    /*** @param {Item} item */
    add(item) {
        for (let i = 0; i < this.size; i++) {
            if (item.count === 0) return;
            this.addAt(i, item);
        }
    };

    /*** @param {Item} item */
    remove(item) {
        for (let i = 0; i < this.size; i++) {
            if (item.count === 0) return;
            this.removeAt(i, item);
        }
    };

    /*** @param {ItemDescriptor} desc */
    removeDesc(desc) {
        let count = desc.count ?? 1;
        for (let i = 0; i < this.size; i++) {
            if (count === 0) return 0;
            count = this.removeDescAt(i, desc, count);
        }
        return count;
    };

    /**
     * @param {number} index
     * @param {Item} item
     */
    addAt(index, item) {
        const it = this.contents[index];
        const maxStack = getItemMaxStack(item.id);
        if (!it) {
            const putting = Math.min(maxStack, item.count);
            item.count -= putting;
            this.contents[index] = item.clone(putting);
            this.dirty.add(index);
            return;
        }
        if (it.equals(item, false, true) && it.count < maxStack) {
            const putting = Math.min(maxStack - it.count, item.count);
            item.count -= putting;
            it.count += putting;
            this.dirty.add(index);
            return;
        }
    };

    /**
     * @param {number} index
     * @param {Item} item
     */
    removeAt(index, item) {
        const it = this.contents[index];
        if (!it || !it.equals(item, false, true)) return;
        if (it.count <= item.count) {
            this.contents[index] = null;
            item.count -= it.count;
            this.dirty.add(index);
            return;
        }
        it.count -= item.count;
        item.count = 0;
        this.dirty.add(index);
        return;
    };

    /**
     * @param {number} index
     * @param {ItemDescriptor} desc
     * @param {number} count
     */
    removeDescAt(index, desc, count) {
        const it = this.contents[index];
        if (!it || !desc.equalsItem(it)) return count;
        if (it.count <= count) {
            this.contents[index] = null;
            this.dirty.add(index);
            return count - it.count;
        }
        it.count -= count;
        this.dirty.add(index);
        return 0;
    };

    removeIndex(index) {
        this.contents[index] = null;
        this.dirty.add(index);
    };

    setIndex(index, item) {
        this.contents[index] = item;
        this.dirty.add(index);
    };

    clear() {
        this.contents = new Array(this.size).fill(null);
    };

    serialize() {
        return this.contents.map(i => i ? i.serialize() : null);
    };
}