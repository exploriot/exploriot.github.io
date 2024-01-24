import {Tile} from "./Tile.js";
import {Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {Item} from "../../../client/common/item/Item.js";

export class ContainerTile extends Tile {
    /*** @type {Set<S_Player>} */
    viewers = new Set;

    init() {
        this.container = new Inventory(this.size, InventoryIds.EXTERNAL, {
            // tile: this,
            containerId: this.containerId,
            x: this.x,
            y: this.y
        });
        this.container._tile = this;
        if (this._contents) {
            this.container.contents = this._contents.map(Item.deserialize);
            delete this._contents;
        }
    };

    getClientState() {
        return {};
    };

    update(dt) {
        this.cleanPackets();
        super.update(dt);
    };

    getClientExtra() {
        return {
            ...super.getClientExtra(), containerId: this.containerId
        };
    };

    cleanPackets() {
        if (this.container.cleanDirty) {
            return this.broadcastContainer();
        }
        for (const index of this.container.dirtyIndexes) {
            this.broadcastContainerIndexes(Array.from(this.container.dirtyIndexes));
            this.container.dirtyIndexes.clear();
        }
    };

    broadcastState() {
        for (const player of this.viewers) {
            player.session.sendContainerState(this.getClientState());
        }
    };

    broadcastContainerIndexes(indexes) {
        for (const player of this.viewers) {
            if (player.externalInventory !== this.container) {
                this.viewers.delete(player);
                continue;
            }
            player.session.sendIndexPackets(InventoryIds.EXTERNAL, indexes);
        }
    };

    broadcastContainer() {
        for (const player of this.viewers) {
            player.session.sendInventory(this.container);
        }
    };

    serialize() {
        return {
            ...super.serialize(), contents: this.container.serialize()
        };
    };

    remove() {
        for (const item of this.container.contents) this.world.dropItem(this.x, this.y, item);
        this.container.clear();
        super.remove();
    };
}