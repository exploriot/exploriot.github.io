import {Tile} from "./Tile.js";
import {Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {Item} from "../../../client/common/item/Item.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {InventoryTag} from "../../../client/common/compound/InventoryTag.js";

export class ContainerTile extends Tile {
    static NBT_STRUCTURE = new ObjectTag({
        container: new InventoryTag(new Inventory(100, InventoryIds.EXTERNAL))
    }).combine(Tile.NBT_STRUCTURE);
    static NBT_IGNORE = ["type", "container"];

    /*** @type {Set<S_Player>} */
    viewers = new Set;

    getClientContainer() {
        return this.container;
    };

    init() {
        this.container = new Inventory(this.size, InventoryIds.EXTERNAL, {
            containerId: this.containerId,
            x: this.x,
            y: this.y
        });
        this.nbt.tags.container.tags.size.value = this.size;
        this.container._tile = this;
        const contents = this.nbt.tags.container.tags.contents.value.map(Item.deserialize);
        const len = Math.min(contents.length, this.size);
        for (let i = 0; i < len; i++) {
            this.container.set(i, contents[i]);
        }
        return true;
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
        const container = this.getClientContainer();
        if (container.cleanDirty) return this.broadcastContainer();

        this.broadcastContainerIndexes(Array.from(container.dirtyIndexes));
        container.dirtyIndexes.clear();
    };

    broadcastState() {
        for (const player of this.viewers) {
            player.session.sendContainerState(this.getClientState());
        }
    };

    getCleanViewers() {
        return [this.viewers];
    };

    broadcastContainerIndexes(indexes) {
        if (indexes.length === 0) return;
        const container = this.getClientContainer();
        const viewerParent = this.getCleanViewers();
        for (const viewers of viewerParent) for (const player of viewers) {
            if (player.externalInventory !== container) {
                viewers.delete(player);
                continue;
            }
            player.session.sendIndexPackets(InventoryIds.EXTERNAL, indexes);
        }
    };

    broadcastContainer() {
        for (const player of this.viewers) {
            player.session.sendInventory(this.getClientContainer());
        }
    };

    saveNBT() {
        super.saveNBT();
    };

    remove() {
        for (const item of this.container.getContents()) this.world.dropItem(this.x, this.y, item);
        this.container.clear();
        super.remove();
    };
}