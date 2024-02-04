import {TileIds} from "./Tile.js";
import {ContainerTile} from "./ContainerTile.js";
import {ContainerIds, InventoryIds} from "../../../client/common/item/Inventory.js";
import {VirtualInventory} from "../../../client/common/item/VirtualInventory.js";

export class ChestTile extends ContainerTile {
    static TYPE = TileIds.CHEST;
    containerId = ContainerIds.CHEST;
    size = 27;
    _isDouble = false;
    _meta = 0;

    getCleanViewers() {
        const v = super.getCleanViewers();
        if (this._isDouble) {
            const k = this._meta === 1 ? 1 : -1;
            this.world.checkTile(this.x + k, this.y);
            const tile = this.world.getTile(this.x + k, this.y);
            if (tile) v.push(tile.viewers);
        }
        return v;
    };

    updateDouble(meta) {
        const isDouble = meta !== 0;
        this._meta = meta;
        if (isDouble === this._isDouble) return;
        this._isDouble = isDouble;
        if (!isDouble) return delete this._container;
        if (meta === 1) {
            this.world.checkTile(this.x + 1, this.y);
            const tile = this.world.getTile(this.x + 1, this.y);
            this._container = new VirtualInventory(InventoryIds.EXTERNAL, [
                this.container, tile.container
            ], {
                containerId: this.containerId,
                x: this.x,
                y: this.y
            });
            this._container._tile = this;
        } else {
            this.world.checkTile(this.x - 1, this.y);
            const tile = this.world.getTile(this.x - 1, this.y);
            tile.updateDouble(1);
            this._container = tile._container;
        }
    };

    getClientContainer() {
        return this._container ?? this.container;
    };

    getClientExtra() {
        return {
            ...super.getClientExtra(), isDouble: this._isDouble
        };
    };
}