export class Item {
    /**
     * @param {number} id
     * @param {number} meta
     * @param {number} count
     * @param {Object} nbt
     */
    constructor(id, meta = 0, count = 1, nbt = {}) {
        this.id = id;
        this.meta = meta;
        this.count = count;
        this.nbt = nbt;
    };

    equals(item, count = true, nbt = true) {
        if (!item) return false;
        return item.id === this.id
            && item.meta === this.meta
            && (!count || item.count === this.count)
            && (!nbt || JSON.stringify(item.nbt) === JSON.stringify(this.nbt));
    };

    clone(count) {
        return new Item(this.id, this.meta, count ?? this.count, JSON.parse(JSON.stringify(this.nbt)))
    };

    serialize() {
        return {id: this.id, meta: this.meta, count: this.count, nbt: JSON.parse(JSON.stringify(this.nbt))};
    };

    static deserialize(data) {
        return data ? new Item(data.id, data.meta, data.count, data.nbt) : null;
    };
}

export class ItemDescriptor {
    /**
     * @param {number} id
     * @param {number | null} meta
     * @param {number | null} count
     * @param {number | null} nbt
     */
    constructor(id, meta = null, count = null, nbt = null) {
        this.id = id;
        this.meta = meta;
        this.count = count;
        this.nbt = nbt;
        this.chance = null;
    };

    setChance(chance) {
        this.chance = chance;
        return this;
    };

    equalsItem(item) {
        if (!item) return false;
        return this.id === item.id
            && (this.meta === null || this.meta === item.meta)
            && (this.count === null || this.count === item.count)
            && (this.nbt === null || JSON.stringify(this.nbt) === JSON.stringify(item.nbt));
    };

    evaluate() {
        if (this.chance !== null && Math.random() > this.chance) return null;
        return new Item(this.id, this.meta || 0, this.count || 1, this.nbt || {});
    };
}