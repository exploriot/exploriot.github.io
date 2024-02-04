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
        this.extra = extra;
        this.init();
    };

    init() {
        /**
         * @type {(Item | null)[]}
         * @private
         */
        this.contents = new Array(this.size).fill(null);
    };

    getContents() {
        return this.contents;
    };

    get(index) {
        return this.contents[index];
    };

    set(index, item, update = true) {
        this.contents[index] = item;
        if (update) this.dirtyIndexes.add(index);
    };

    clear() {
        this.cleanDirty = true;
        this.dirtyIndexes.clear();
        this.contents.fill(null);
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
        const it = this.get(index);
        const maxStack = item.maxStack;
        if (!it) {
            const putting = Math.min(maxStack, item.count);
            item.count -= putting;
            this.set(index, item.clone(putting));
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
        const it = this.get(index);
        if (!it || !it.equals(item, false, true)) return;
        if (it.count <= item.count) {
            this.removeIndex(index);
            item.count -= it.count;
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
        const it = this.get(index);
        if (!it || !desc.equalsItem(it)) return count;
        if (it.count <= count) {
            this.removeIndex(index);
            return count - it.count;
        }
        it.count -= count;
        this.dirtyIndexes.add(index);
        return 0;
    };

    removeIndex(index) {
        this.set(index, null);
    };

    updateIndex(index) {
        const item = this.get(index);
        if (item && item.count <= 0) this.removeIndex(index);
        else this.dirtyIndexes.add(index);
    };

    /**
     * @param {number} index
     * @param {number} amount
     * @param {S_World | null} world
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    damageItemAt(index, amount = 1, world = null, x = 0, y = 0) {
        const item = this.get(index);
        if (item && item.id in Metadata.durabilities) {
            const durability = Metadata.durabilities[item.id];
            item.nbt.damage ??= 0;
            if ((item.nbt.damage += amount) >= durability) {
                this.removeIndex(index);
                if (world) {
                    world.playSound("assets/sounds/random/break.ogg", x, y);
                }
            } else this.updateIndex(index);
        }
    };

    decreaseItemAt(index, amount = 1) {
        const item = this.get(index);
        if (item) {
            item.count -= amount;
            this.updateIndex(index);
        }
    };

    serialize() {
        return this.getContents().map(i => i ? i.serialize() : 0);
    };
}