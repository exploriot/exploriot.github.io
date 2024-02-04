import {Ids} from "../../../client/common/metadata/Ids.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {randomUUID} from "crypto";
import {UInt8Tag} from "../../../client/common/compound/int/UInt8Tag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";

export const TileIds = {
    FURNACE: 0,
    CHEST: 1,
    SPAWNER: 2,
    __LEN: 3
};

export const TileBlockIdMap = {
    [Ids.FURNACE]: TileIds.FURNACE,
    [Ids.CHEST]: TileIds.CHEST,
    [Ids.ENTITY_SPAWNER]: TileIds.SPAWNER
};

/**
 * @property {number} type
 * @property {string} uuid
 * @property {number} x
 * @property {number} y
 * @property {number} updateCounter
 */
export class Tile {
    static NBT_STRUCTURE = new ObjectTag({
        type: new UInt8Tag(0),
        uuid: new StringTag(""),
        x: new Float32Tag(0),
        y: new Float32Tag(0),
        updateCounter: new Float32Tag(0)
    });
    static NBT_IGNORE = ["type"];

    updatePeriod = 1;

    /**
     * @param {S_World} world
     * @param {ObjectTag} nbt
     */
    constructor(world, nbt = new ObjectTag()) {
        this.type = this.constructor.TYPE;
        this.world = world;
        /*** @type {ObjectTag} */
        this.nbt = this.constructor.NBT_STRUCTURE.clone().applyThis(nbt.value);
        this.nbt.applyTo(this, this.constructor.NBT_IGNORE);
        this.uuid ||= randomUUID();
    };

    init() {
        return true;
    };

    update(dt) {
    };

    getClientExtra() {
        return {
            x: this.x, y: this.y
        };
    };

    remove() {
        this.world.getChunkTiles(this.x >> 4).delete(this);
        const holder = this.world.tiles[this.x] ??= {};
        delete holder[this.y];
    };

    saveNBT() {
        this.nbt.apply(this);
    };
}