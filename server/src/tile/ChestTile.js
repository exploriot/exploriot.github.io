import {TileIds} from "./Tile.js";
import {ContainerTile} from "./ContainerTile.js";
import {ContainerIds} from "../../../client/common/item/Inventory.js";

export class ChestTile extends ContainerTile {
    isDouble = false;

    constructor(world, x, y) {
        super(TileIds.CHEST, world, x, y);
    };

    init() {
        this.size = this.isDouble ? 54 : 27;
        this.containerId = this.isDouble ? ContainerIds.DOUBLE_CHEST : ContainerIds.CHEST;
        super.init();
    };

    static deserialize(world, data) {
        const tile = new ChestTile(world, data.x, data.y);
        tile.isDouble = data.isDouble;
        tile._contents = data.contents;
        return tile;
    };

    serialize() {
        return {
            ...super.serialize(), isDouble: this.isDouble
        };
    };
}