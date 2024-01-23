import {Ids} from "../../../client/common/metadata/Ids.js";

export const TileIds = {
    FURNACE: 0,
    CHEST: 1,
    __LEN: 2
};

export const TileBlockIdMap = {
    [Ids.FURNACE]: TileIds.FURNACE,
    [Ids.CHEST]: TileIds.CHEST
};

export class Tile {
    updatePeriod = 1;
    __updateCounter = 0;

    /**
     * @param {number} type
     * @param {S_World} world
     * @param {number} x
     * @param {number} y
     */
    constructor(type, world, x, y) {
        this.type = type;
        this.world = world;
        this.x = x;
        this.y = y;
    };

    init() {
    };

    update(dt) {
    };

    getClientExtra() {
        return {
            x: this.x, y: this.y
        };
    };

    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y
        };
    };

    add() {
        const holder = this.world.tiles[this.x] ??= {};
        holder[this.y] = this;
        (this.world.chunkTiles[this.x >> 4] ??= []).push(this);
    };

    remove() {
        const holder = this.world.tiles[this.x] ??= {};
        delete holder[this.y];
        const tiles = this.world.chunkTiles[this.x >> 4] ??= [];
        if (tiles.includes(this)) tiles.splice(tiles.indexOf(this), 1);
    };
}