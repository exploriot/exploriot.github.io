import {SUB_CHUNK_AMOUNT} from "../../../client/common/world/World.js";
import {SubChunkPacket} from "../packet/SubChunkPacket.js";
import {BatchPacket} from "../packet/BatchPacket.js";
import {WelcomePacket} from "../packet/WelcomePacket.js";
import {_T, _TA} from "../../../client/common/Utils.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {BlockBreakingUpdatePacket} from "../packet/BlockBreakingUpdatePacket.js";
import {PacketIds} from "../../../client/common/metadata/PacketIds.js";
import {DisconnectPacket} from "../packet/DisconnectPacket.js";
import {EntityUpdatePacket} from "../packet/EntityUpdatePacket.js";
import {BlockUpdatePacket} from "../packet/BlockUpdatePacket.js";
import {PingPacket} from "../packet/PingPacket.js";
import {InventoryUpdatePacket} from "../packet/InventoryUpdatePacket.js";
import {ContainerIds, Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {InventorySetIndexPacket} from "../packet/InventorySetIndexPacket.js";
import {getBlockHardness, isBlockItem} from "../../../client/common/metadata/Blocks.js";
import {SetPositionPacket} from "../packet/SetPositionPacket.js";
import {findCrafting} from "../../../client/common/metadata/Crafts.js";
import {SendMessagePacket} from "../packet/SendMessagePacket.js";
import {OpenContainerPacket} from "../packet/OpenContainerPacket.js";
import {CloseContainerPacket} from "../packet/CloseContainerPacket.js";
import {SetAttributesPacket} from "../packet/SetAttributesPacket.js";
import {EntityRemovePacket} from "../packet/EntityRemovePacket.js";
import {SetHandIndexPacket} from "../packet/SetHandIndexPacket.js";
import {S_TNTEntity} from "../entity/TNTEntity.js";
import {ContainerStatePacket} from "../packet/ContainerStatePacket.js";

const PacketMap = {
    [PacketIds.BATCH]: "handleBatchPacket",
    [PacketIds.CLIENT_MOVEMENT]: "handleMovementPacket",
    [PacketIds.CLIENT_BREAK_BLOCK]: "handleBlockBreakPacket",
    [PacketIds.CLIENT_PLACE_BLOCK]: "handleBlockPlacePacket",
    [PacketIds.CLIENT_BLOCK_BREAKING_UPDATE]: "handleBlockBreakingUpdatePacket",
    [PacketIds.CLIENT_PING]: "handlePingPacket",
    [PacketIds.CLIENT_INVENTORY_TRANSACTION]: "handleInventoryTransactionPacket",
    [PacketIds.CLIENT_HAND_ITEM]: "handleHandItemPacket",
    [PacketIds.CLIENT_ITEM_DROP]: "handleItemDropPacket",
    [PacketIds.CLIENT_SEND_MESSAGE]: "handleSendMessagePacket",
    [PacketIds.CLIENT_INTERACT_BLOCK]: "handleInteractBlockPacket",
    [PacketIds.CLIENT_CLOSE_CONTAINER]: "handleCloseContainerPacket",
    [PacketIds.CLIENT_TOGGLE_FLIGHT]: "handleToggleFlightPacket",
    [PacketIds.CLIENT_ITEM_TRANSFER]: "handleItemTransferPacket",
};

const PING_INTERVAL = 2000; // the time it takes the server to send the new ping
const PING_TIMEOUT = 3000; // the timeout that will result player getting kicked

export class NetworkSession {
    sentChunks = [];
    pingTimeout = null;
    pingStart = null;
    ping = 0;
    queuedPackets = [];
    /*** @type {Set<S_Entity>} */
    viewingEntities = new Set;
    active = true;
    /*** @type {Set<ContainerTile>} */
    subscribedTiles = new Set;

    /**
     * @param {S_Player} player
     * @param ws
     */
    constructor(player, ws) {
        this.player = player;
        this.ws = ws;
    };

    cleanPackets() {
        if (this.queuedPackets.length) this.sendPackets(this.queuedPackets, true);
        this.queuedPackets.length = 0;
        if (this.player.playerInventory.dirtyIndexes.has(this.player.handIndex)) this.player.broadcastHandItem();
        for (const inv of this.player.getInventories()) {
            if (inv._tile) continue; // it shouldn't be updated prior to a single player because it's a multiplayer container
            if (inv.cleanDirty) {
                this.sendInventory(inv);
            } else this.sendIndexPackets(inv.type, inv.dirtyIndexes);
            inv.dirtyIndexes.clear();
        }
    };

    requestPing() {
        clearTimeout(this.pingTimeout);
        this.sendPacket(PingPacket(), true);
        this.pingStart = Date.now();
        this.pingTimeout = setTimeout(() => {
            this.disconnect("Timed out.");
        }, PING_TIMEOUT);
    };

    sendPacket(pk, immediate = false) {
        if (immediate) {
            this.ws.send(JSON.stringify(pk));
        } else this.queuedPackets.push(pk);
    };

    sendPackets(packets, immediate = false) {
        if (immediate) {
            this.sendPacket(BatchPacket(packets), true);
        } else this.queuedPackets.push(...packets);
    };

    sendBlock(x, y) {
        const block = this.player.world.getBlock(x, y);
        this.sendPacket(BlockUpdatePacket(x, y, block[0], block[1]));
    }

    sendChunk(x, force = false) {
        if (this.sentChunks.includes(x) && !force) return;
        const chunk = this.player.world.loadChunk(x);
        for (let y = 0; y < SUB_CHUNK_AMOUNT; y++) {
            const subChunk = chunk[y];
            this.sendPacket(SubChunkPacket(x, y, subChunk));
        }
        const chunkEntities = this.player.world.chunkEntities[x];
        if (chunkEntities) for (const e of chunkEntities) {
            if (e.id === this.player.id) continue;
            this.showEntity(e);
        }
        if (!this.sentChunks.includes(x)) this.sentChunks.push(x);
    };

    sendWelcomePacket() {
        this.sendPacket(WelcomePacket(Server.getChunkDistance(), this.player.id));
    };

    sendPosition() {
        this.sendPacket(SetPositionPacket(this.player.x, this.player.y))
    };

    sendInventories() {
        for (const inv of this.player.getInventories()) {
            this.sendInventory(inv);
        }
    };

    sendInventory(inventory) {
        this.sendPacket(InventoryUpdatePacket(inventory.type, inventory.serialize(), inventory.extra ?? {}));
    };

    sendAttributes() {
        this.sendPacket(SetAttributesPacket(this.player.attributes));
    };

    serializeItem(item) {
        return item && item.count > 0 ? item.serialize() : null;
    };

    getIndexPackets(id, indices) {
        if (indices.length === 0) return;
        const packets = [];
        for (const i of indices) {
            packets.push(InventorySetIndexPacket(
                id, i, this.serializeItem(this.player.getInventory(id).contents[i])
            ));
        }
        return packets;
    };

    sendIndexPackets(id, indices) {
        if (indices.length === 0) return;
        this.sendPackets(this.getIndexPackets(id, indices));
    };

    sendMessagePacket(message) {
        this.sendPacket(SendMessagePacket(message));
    };

    forceCloseContainer() {
        this.handleCloseContainerPacket();
        this.sendPacket(CloseContainerPacket());
    };

    showEntity(entity) {
        entity.currentViewers.add(this.player);
        if (this.doesSeeEntity(entity)) return;
        this.sendPacket(EntityUpdatePacket(entity.serialize()));
        this.viewingEntities.add(entity);
    };

    hideEntity(entity) {
        entity.currentViewers.delete(this.player);
        if (!this.doesSeeEntity(entity)) return;
        this.sendPacket(EntityRemovePacket(entity.id));
        this.viewingEntities.delete(entity);
    };

    doesSeeEntity(entity) {
        return this.viewingEntities.has(entity);
    };

    sendHandItemIndex() {
        this.sendPacket(SetHandIndexPacket(this.player.handIndex));
    };

    handleBatchPacket(pk) {
        for (const packet of pk.packets) this.handlePacket(packet);
    };

    handleMovementPacket(pk) {
        _TA(
            pk.x, "number",
            pk.y, "number"
        );

        if (this.player.x === pk.x && this.player.y === pk.y) return;
        if (this.player.externalInventory) this.forceCloseContainer();
        if (Math.abs(this.player.x - pk.x) + Math.abs(this.player.y - pk.y) > 2 * Math.max(50, this.ping) / 100) {
            this.sendPosition();
            return;
        }
        this.player.x = pk.x;
        this.player.y = pk.y;
        this.player.handleMovement();
        this.player.broadcastMovement();
    };

    handleBlockBreakPacket(pk) {
        _TA(
            pk.x, "number",
            pk.y, "number"
        );

        const x = Math.round(pk.x);
        const y = Math.round(pk.y);

        if (this.player.attributes.gamemode > 1 || !this.player.world.canBreakBlockAt(this.player, x, y, this.player.attributes.gamemode)) return this.sendBlock(x, y);

        const existing = this.player.world.getBlock(x, y);
        const baseHardness = Metadata.hardness[existing[0]];
        const handItem = this.player.getHandItem();
        if (this.player.attributes.gamemode !== 1) {
            if (baseHardness !== 0) {
                if (!this.player.breaking) return this.sendBlock(x, y);
                if (this.player.breakingEndAt - Date.now() > 100 * Math.max(50, this.ping) / 100) return this.sendBlock(x, y);
            }
            if (handItem && handItem.id in Metadata.durabilities) {
                const durability = Metadata.durabilities[handItem.id];
                handItem.nbt.damage ??= 0;
                const damage = ++handItem.nbt.damage;
                if (damage >= durability) {
                    this.player.playerInventory.removeIndex(this.player.handIndex);
                }
            }
        }

        this.player.world.breakBlock(x, y, handItem, this.player.attributes.gamemode === 1);
    };

    handleBlockPlacePacket(pk) {
        _TA(
            pk.x, "number",
            pk.y, "number",
            pk.id, "number",
            pk.meta, "number"
        );

        const x = Math.round(pk.x);
        const y = Math.round(pk.y);

        if (this.player.attributes.gamemode > 1 || !this.player.world.canPlaceBlockAt(this.player, x, y)) return this.sendBlock(x, y);

        const handItem = this.player.getHandItem();

        if (!handItem || !isBlockItem(handItem.id)) return this.sendBlock(x, y);

        if (this.player.attributes.gamemode !== 1) {
            handItem.count--;
            if (handItem.count <= 0) this.player.playerInventory.removeIndex(this.player.handIndex);
            else this.player.playerInventory.updateIndex(this.player.handIndex);
        }

        this.player.world.setBlock(x, y, handItem.id, handItem.meta);

        this.player.world.checkTile(x, y);
    };

    handleBlockBreakingUpdatePacket(packet) {
        _TA(
            packet.x, "number",
            packet.y, "number",
            packet.state, "boolean"
        );

        if (packet.state && !this.player.canReachBlock(packet.x, packet.y)) return;
        if (!packet.state && !this.player.breaking) return;

        const blockId = this.player.world.getBlock(packet.x, packet.y)[0];
        const handItem = this.player.getHandItem();
        const hardness = getBlockHardness(blockId, handItem ? handItem.id : 0, 0, 0);
        if (hardness === -1 || hardness === 0) return;
        this.player.breaking = packet.state ? {x: packet.x, y: packet.y} : null;
        this.player.breakingEndAt = Date.now() + hardness * 1000;

        const bPk = BlockBreakingUpdatePacket(this.player.id, this.player.breaking);
        for (const p of Server.getPlayers()) {
            if (p === this.player) continue;
            p.session.sendPacket(bPk);
        }
    };

    handlePingPacket() {
        if (this.pingTimeout === null) return;
        clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
        this.ping = Date.now() - this.pingStart;
        setTimeout(() => this.requestPing(), PING_INTERVAL);
    };

    // todo: for crafting table if the player gets too far like 10 blocks, it should close the crafting table

    handleCraftInventory() {
        const inv = this.player.craftInventory;
        const crafting = findCrafting([
            [inv.contents[0], inv.contents[1]],
            [inv.contents[2], inv.contents[3]]
        ]);
        if (crafting) inv.setIndex(4, crafting.result.evaluate());
        else inv.removeIndex(4);
    };

    handleCraftingTable() {
        const ext = this.player.externalInventory;
        if (
            !ext || ext.extra.containerId !== ContainerIds.CRAFTING_TABLE
        ) return;
        const crafting = findCrafting([
            [ext.contents[0], ext.contents[1], ext.contents[2]],
            [ext.contents[3], ext.contents[4], ext.contents[5]],
            [ext.contents[6], ext.contents[7], ext.contents[8]]
        ]);
        if (crafting) ext.setIndex(9, crafting.result.evaluate());
        else ext.removeIndex(9);
    };

    canCombine(item1, item2, count) {
        if (!item1 || (item2 && !item1.equals(item2, false, true))) return;
        const maxStack = item1.maxStack;
        return maxStack - (item2 ? item2.count : 0) >= count;
    };

    computeCombine(inv1, inv2, index1, index2, item1, item2, count) {
        const maxStack = item1.maxStack;
        const putting = Math.min(maxStack - (item2 ? item2.count : 0), count);
        item1.count -= putting;
        if (item2) {
            item2.count += putting;
        } else {
            inv2.setIndex(index2, item1.clone(putting));
        }
        if (item1.count <= 0) inv1.removeIndex(index1);
        else inv1.updateIndex(index1);
        inv2.updateIndex(index2);
    };

    _firstTransactionFailCheck(id1, id2, index1, index2, count) { // returns true if the packet is invalid
        const ext = this.player.externalInventory;
        return (id1 === id2 && index1 === index2)
            || (id2 === InventoryIds.CRAFT && index2 === 4)
            || ((id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL) && !ext)
            || (
                id2 === InventoryIds.EXTERNAL && (
                    (ext.extra.containerId === ContainerIds.FURNACE && index2 === 2)
                    || (ext.extra.containerId === ContainerIds.CRAFTING_TABLE && index2 === 9)
                )
            )
            || count <= 0
            || (
                ext && (
                    id1 === InventoryIds.CRAFT
                    || id2 === InventoryIds.ARMOR
                    || id1 === InventoryIds.ARMOR
                    || id2 === InventoryIds.ARMOR
                )
            );
    };

    _getTransactionCraftInfo(id, inv, index) {
        const ext = this.player.externalInventory;
        const isNormalCraft = id === InventoryIds.CRAFT && index === 4;
        const isCraftingTable = id === InventoryIds.EXTERNAL && ext.extra.containerId === ContainerIds.CRAFTING_TABLE && index === 9;

        let crafting = null;
        if (isNormalCraft) crafting = findCrafting([
            [inv.contents[0], inv.contents[1]],
            [inv.contents[2], inv.contents[3]]
        ]); else if (isCraftingTable) crafting = findCrafting([
            [inv.contents[0], inv.contents[1], inv.contents[2]],
            [inv.contents[3], inv.contents[4], inv.contents[5]],
            [inv.contents[6], inv.contents[7], inv.contents[8]]
        ]);
        return crafting;
    };

    _endTransactionUpdate(id1, id2) {
        if (
            id1 === InventoryIds.CRAFT
            || id2 === InventoryIds.CRAFT
        ) this.handleCraftInventory();

        const ext = this.player.externalInventory;
        if (
            ext && ext.extra.containerId === ContainerIds.CRAFTING_TABLE
            && (id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL)
        ) this.handleCraftingTable();
    };

    handleInventoryTransactionPacket(packet) {
        _TA(
            packet.id1, "number",
            packet.id2, "number",
            packet.index1, "uint",
            packet.index2, "uint",
            packet.count, "uint"
        );

        const {id1, id2, index1, index2, count} = packet;

        const success = () => true; // do something maybe

        // should be cancelling here, but can't, if this happens they're cheating anyway :eyes:
        if (this._firstTransactionFailCheck(id1, id2, index1, index2, count)) return;

        const inv1 = this.player.getInventory(id1);
        const inv2 = this.player.getInventory(id2);
        const cancel = () => {
            inv1.updateIndex(index1);
            inv2.updateIndex(index2);
        };

        if (!inv1 || !inv2 || index1 >= inv1.size || index2 >= inv2.size) return cancel();

        const item1 = inv1.contents[index1];
        const item2 = inv2.contents[index2];

        if (!item1 || count > item1.count) return cancel();

        const ext = this.player.externalInventory;

        if (
            id2 === InventoryIds.EXTERNAL
            && ext.extra.containerId === ContainerIds.FURNACE
            && (
                (index2 === 1 && !(item1.id in Metadata.fuel))
                || (index2 === 0 && !(item1.id in Metadata.smeltsTo))
            )
        ) return cancel();

        if (
            id2 === InventoryIds.ARMOR
            && !(item1.id in Metadata.armors)
        ) return cancel();

        // things we know from here:
        // item1 is an item that has a count lower than the `count` variable
        // they have a valid index

        const isNormalCraft = id1 === InventoryIds.CRAFT && index1 === 4;
        const isCraftingTable = id1 === InventoryIds.EXTERNAL && ext.extra.containerId === ContainerIds.CRAFTING_TABLE && index1 === 9;

        if (isNormalCraft || isCraftingTable) {
            if (!this.canCombine(item1, item2, count)) return cancel();
            let crafting = this._getTransactionCraftInfo(id1, inv1, index1);
            if (!crafting) return cancel();
            this.computeCombine(inv1, inv2, index1, index2, item1, item2, count);
            if (item1.count > 0) {
                this.player.world.dropItem(this.player.x, this.player.y, item1);
                inv1.removeIndex(index1);
            }
            for (const desc of crafting.recipe.flat(1)) inv1.removeDesc(desc);
        } else if (!item2) { // if the target item is empty, put the `count` amount of items to the target
            this.computeCombine(inv1, inv2, index1, index2, item1, item2, count);
        } else if (!item1.equals(item2, false, true)) { // if the items are different, swap
            inv1.setIndex(index1, item2);
            inv2.setIndex(index2, item1);
        } else {
            // at this point, because of the if statements, both items are non-null
            // furthermore; both items have the same id, meta and nbt

            // now it should combine item1 to item2
            // since canCombine() at this point is always true, I won't check for it again
            this.computeCombine(inv1, inv2, index1, index2, item1, item2, count);
        }

        if ((id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL) && this.player.externalInventory._tile) {
            this.player.externalInventory._tile.cleanPackets();
        }

        this._endTransactionUpdate(id1, id2);

        success();
    };

    computeItemTransfer(inv1, inv2, item1, index1, count) {
        const it = item1.clone(count);
        if (inv1.type === inv2.type && index1 < inv1.size / 2) inv2.addFromBack(it);
        else inv2.add(it);
        const done = count - it.count;
        item1.count -= done;
        if (item1.count <= 0) inv1.removeIndex(index1);
        else inv1.updateIndex(index1);
    };

    handleItemTransferPacket(packet) {
        _TA(
            packet.id1, "number",
            packet.id2, "number",
            packet.index1, "uint",
            packet.count, "uint"
        );

        const {id1, id2, index1, count} = packet;

        const success = () => true; // do something maybe

        const ext = this.player.externalInventory;

        if (
            id2 === InventoryIds.CRAFT
            || (!ext && (id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL))
            || (id2 === InventoryIds.EXTERNAL && ext && ext.extra.containerId === ContainerIds.CRAFTING_TABLE)
            || count <= 0
        ) return; // should be cancelling here, but can't, if this happens they're cheating anyway :eyes:

        const inv1 = this.player.getInventory(id1);
        const inv2 = this.player.getInventory(id2);
        const cancel = () => {
            inv1.updateIndex(index1);
            this.sendInventory(inv2.type);
        };

        if (
            !inv1
            || !inv2
            || index1 >= inv1.size
            || inv2.type === InventoryIds.CRAFT
            || (inv2.type === InventoryIds.EXTERNAL && ext.extra.containerId === ContainerIds.CRAFTING_TABLE)
        ) return cancel();

        const item1 = inv1.contents[index1];

        if (!item1 || count > item1.count) return cancel();

        let crafting = this._getTransactionCraftInfo(id1, inv1, index1)
        if (crafting === undefined) return cancel();

        if (crafting) {
            if (item1.count > 0) {
                this.player.world.dropItem(this.player.x, this.player.y, item1);
                inv1.removeIndex(index1);
            }
            for (const desc of crafting.recipe.flat(1)) inv1.removeDesc(desc);
        }

        if ((id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL) && this.player.externalInventory._tile) {
            this.player.externalInventory._tile.cleanPackets();
        }

        this.computeItemTransfer(inv1, inv2, item1, index1, count);

        this._endTransactionUpdate(id1, id2);

        success();
    };

    handleHandItemPacket(packet) {
        _T(packet.index, "uint");
        if (packet.index > 9) throw new Error("Invalid hand index.");
        if (this.player.handIndex === packet.index) return;
        this.player.handIndex = packet.index;
    };

    handleItemDropPacket(packet) {
        _TA(
            packet.id, "uint",
            packet.index, "uint",
            packet.count, "uint"
        );

        const {id, index, count} = packet;

        if (count <= 0) return;

        const inv = this.player.getInventory(id);
        if (!inv) return;

        const ext = this.player.externalInventory;

        if (
            (inv.type === InventoryIds.CRAFT && index === 4)
            || (inv.type === InventoryIds.EXTERNAL && ext.extra.containerId === ContainerIds.CRAFTING_TABLE && index === 9)
        ) return;

        const item = inv.contents[index];

        if (!item || item.count < count) return;

        item.count -= count;
        if (item.count <= 0) inv.removeIndex(index);
        else inv.updateIndex(index);

        const drop = item.clone(count);
        this.player.world.dropItem(this.player.x, this.player.y + this.player.baseBB.y2, drop, 1000, (this.player.bodyRotation ? 1 : -1) * 15, 0);
    };

    handleSendMessagePacket(pk) {
        _T(pk.message, "string");
        if (!pk.message || pk.message.includes("\n")) return;
        this.player.processMessage(pk.message);
    };

    sendContainerState(state) {
        this.sendPacket(ContainerStatePacket(state));
    };

    handleInteractBlockPacket(pk) {
        _TA(
            pk.x, "number",
            pk.y, "number"
        );

        const x = Math.round(pk.x);
        const y = Math.round(pk.y);

        if (!this.player.world.canInteractBlockAt(this.player, x, y)) return;

        const block = this.player.world.getBlock(x, y);

        let ext = this.player.externalInventory;

        if (block[0] === Ids.CRAFTING_TABLE) {
            if (ext) return;
            ext = this.player.externalInventory = new Inventory(10, InventoryIds.EXTERNAL, {
                containerId: ContainerIds.CRAFTING_TABLE, x, y
            });
            this.sendPacket(OpenContainerPacket({
                containerId: ext.extra.containerId, x, y
            }));
        }
        if (block[0] === Ids.FURNACE || block[0] === Ids.CHEST) {
            if (ext) return;
            this.player.world.checkTile(x, y);
            const tile = this.player.world.getTile(x, y);
            this.player.externalInventory = tile.container;
            tile.viewers.add(this.player);
            this.subscribedTiles.add(tile);
            this.sendPacket(OpenContainerPacket(tile.getClientExtra()));
            this.sendContainerState(tile.getClientState());
            this.sendInventory(this.player.externalInventory);
        }
        if (block[0] === Ids.TNT) {
            const handItem = this.player.getHandItem();
            if (handItem && handItem.id === Ids.FLINT_AND_STEEL) {
                this.player.world.setBlock(x, y, Ids.AIR);
                const entity = new S_TNTEntity(this.player.world);
                entity.x = x;
                entity.y = y;
                entity.parentEntityId = this.player.id;
                this.player.world.addEntity(entity);
            }
        }
    };

    handleCloseContainerPacket() {
        let ext = this.player.externalInventory;
        if (ext && [ContainerIds.CRAFTING_TABLE].includes(ext.extra.containerId)) {
            for (const item of ext.contents) this.player.holdOrDrop(item);
            ext.clear();
        }
        this.player.externalInventory = null;
        for (const sub of this.subscribedTiles) {
            sub.viewers.delete(this.player);
        }
        this.subscribedTiles.clear();
    };

    handleToggleFlightPacket() {
        if (!this.player.attributes.canFly) return;
        this.sendPacket(SetAttributesPacket({
            isFlying: this.player.attributes.isFlying = !this.player.attributes.isFlying
        }));
    };

    handlePacket(pk) {
        this[PacketMap[pk.type]](pk);
    };

    disconnect(reason, immediate = false) {
        this.ws.disconnectReason = reason;
        this.sendPacket(DisconnectPacket(reason), true);
        this.ws.onDisconnect();
        if (immediate) this.ws.close();
        else setTimeout(() => this.ws.close(), 1000);
    };
}