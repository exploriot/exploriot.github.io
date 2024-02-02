import {Item} from "./Item.js";
import {Metadata} from "../metadata/Metadata.js";

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
    FURNACE: 1,
    CHEST: 2,
    DOUBLE_CHEST: 3,
    __LEN: 4
};

export class Inventory {
    cleanDirty = false;
    dirtyIndexes = new Set;
    /*** @type {ContainerTile | null} */
    _tile = null;

    /**
     * @param {number} size
     * @param {number} type
     * @param {any} extra
     */
    constructor(size, type, extra = null) {
        this.size = size;
        this.type = type;
        /*** @type {(Item | null)[]} */
        this.contents = new Array(size).fill(null);
        this.extra = extra;
    };

    /*** @param {Item} item */
    add(item) {
        if (!item) return;
        for (let i = 0; i < this.size; i++) {
            if (item.count === 0) return;
            this.addAt(i, item);
        }
    };

    /*** @param {Item} item */
    remove(item) {
        if (!item) return;
        for (let i = 0; i < this.size; i++) {
            if (item.count === 0) return;
            this.removeAt(i, item);
        }
    };

    /*** @param {Item} item */
    addFromBack(item) {
        if (!item) return;
        for (let i = this.size - 1; i >= 0; i--) {
            if (item.count === 0) return;
            this.addAt(i, item);
        }
    };

    /*** @param {Item} item */
    removeFromBack(item) {
        if (!item) return;
        for (let i = this.size - 1; i >= 0; i--) {
            if (item.count === 0) return;
            this.removeAt(i, item);
        }
    };

    /*** @param {ItemDescriptor} desc */
    removeDesc(desc) {
        if (!desc) return;
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
        if (!item) return;
        const it = this.contents[index];
        const maxStack = item.maxStack;
        if (!it) {
            const putting = Math.min(maxStack, item.count);
            item.count -= putting;
            this.contents[index] = item.clone(putting);
            this.dirtyIndexes.add(index);
            return;
        }
        if (it.equals(item, false, true) && it.count < maxStack) {
            const putting = Math.min(maxStack - it.count, item.count);
            item.count -= putting;
            it.count += putting;
            this.dirtyIndexes.add(index);
            return;
        }
    };

    /**
     * @param {number} index
     * @param {Item} item
     */
    removeAt(index, item) {
        if (!item) return;
        const it = this.contents[index];
        if (!it || !it.equals(item, false, true)) return;
        if (it.count <= item.count) {
            this.contents[index] = null;
            item.count -= it.count;
            this.dirtyIndexes.add(index);
            return;
        }
        it.count -= item.count;
        item.count = 0;
        this.dirtyIndexes.add(index);
        return;
    };

    /**
     * @param {number} index
     * @param {ItemDescriptor} desc
     * @param {number} count
     */
    removeDescAt(index, desc, count) {
        if (!desc) return;
        const it = this.contents[index];
        if (!it || !desc.equalsItem(it)) return count;
        if (it.count <= count) {
            this.contents[index] = null;
            this.dirtyIndexes.add(index);
            return count - it.count;
        }
        it.count -= count;
        this.dirtyIndexes.add(index);
        return 0;
    };

    removeIndex(index) {
        this.contents[index] = null;
        this.dirtyIndexes.add(index);
    };

    setIndex(index, item) {
        this.contents[index] = item;
        this.dirtyIndexes.add(index);
    };

    updateIndex(index) {
        const item = this.contents[index];
        if (item && item.count <= 0) this.contents[index] = null;
        this.dirtyIndexes.add(index);
    };

    clear() {
        this.cleanDirty = true;
        this.dirtyIndexes.clear();
        this.contents.fill(null);
    };

    damageItemAt(index, amount = 1) {
        const item = this.contents[index];
        if (item && item.id in Metadata.durabilities) {
            const durability = Metadata.durabilities[item.id];
            item.nbt.damage ??= 0;
            if ((item.nbt.damage += amount) >= durability) this.removeIndex(index);
        }
    };

    decreaseItemAt(index, amount = 1) {
        const item = this.contents[index];
        if (item) {
            item.count -= amount;
            this.updateIndex(index);
        }
    };

    serialize() {
        return this.contents.map(i => i ? i.serialize() : 0);
    };
}