import {SUB_CHUNK_AMOUNT} from "../../../client/common/world/World.js";
import {SubChunkPacket} from "../packet/SubChunkPacket.js";
import {BatchPacket} from "../packet/BatchPacket.js";
import {WelcomePacket} from "../packet/WelcomePacket.js";
import {_T, _TA} from "../../../client/common/Utils.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {BlockBreakingUpdatePacket} from "../packet/BlockBreakingUpdatePacket.js";
import {PacketIds, TransactionTypes} from "../../../client/common/metadata/PacketIds.js";
import {DisconnectPacket} from "../packet/DisconnectPacket.js";
import {EntityUpdatePacket} from "../packet/EntityUpdatePacket.js";
import {BlockUpdatePacket} from "../packet/BlockUpdatePacket.js";
import {PingPacket} from "../packet/PingPacket.js";
import {InventoryUpdatePacket} from "../packet/InventoryUpdatePacket.js";
import {ContainerIds, Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {InventorySetIndexPacket} from "../packet/InventorySetIndexPacket.js";
import {getItemMaxStack} from "../../../client/common/metadata/Items.js";
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
import {S_Server} from "../Server.js";

const PacketMap = {
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
};

const PING_INTERVAL = 5000;
const PING_TIMEOUT = 10000;

export class NetworkSession {
    sentChunks = [];
    pingTimeout = null;
    pingStart = null;
    ping = 0;
    queuedPackets = [];
    dirtyIndexes = new Array(InventoryIds.__LEN).fill(null).map(() => new Set);
    /*** @type {Set<S_Entity>} */
    viewingEntities = new Set;

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
        this.sendChunks();
        if (this.dirtyIndexes[InventoryIds.PLAYER].has(this.player.handIndex)) this.player.broadcastHandItem();
        for (let i = 0; i < this.dirtyIndexes.length; i++) {
            this.sendIndexPackets(i, this.dirtyIndexes[i]);
        }
    };

    requestPing() {
        clearTimeout(this.pingTimeout);
        this.sendPacket(PingPacket());
        this.pingStart = Date.now();
        this.pingTimeout = setTimeout(() => {
            this.disconnect("Timed out.");
        }, PING_TIMEOUT);
    };

    sendPacket(pk, immediate = false) {
        if (immediate) {
            this.ws.emit("packet", pk);
        } else this.queuedPackets.push(pk);
    };

    sendPackets(packets, immediate = false) {
        if (immediate) {
            this.ws.emit("packet", BatchPacket(packets));
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
        const chunkEntities = this.player.world.entityChunks[x];
        if (chunkEntities) for (const e of chunkEntities) {
            if (e.id === this.player.id) continue;
            this.showEntity(e);
        }
        if (!this.sentChunks.includes(x)) this.sentChunks.push(x);
    };

    sendChunks() {
        const cx = this.player.x >> 4;
        const chunkDistance = S_Server.getChunkDistance();
        for (let x = cx - chunkDistance; x < cx + chunkDistance; x++) {
            this.sendChunk(x);
        }
    };

    sendWelcomePacket() {
        this.sendPacket(WelcomePacket(S_Server.getChunkDistance(), this.player.id));
    };

    sendPosition() {
        this.sendPacket(SetPositionPacket(this.player.x, this.player.y))
    };

    sendInventory() {
        this.sendPackets([
            InventoryUpdatePacket(InventoryIds.PLAYER, this.player.playerInventory.serialize()),
            InventoryUpdatePacket(InventoryIds.CURSOR, this.player.cursorInventory.serialize()),
            InventoryUpdatePacket(InventoryIds.CRAFT, this.player.craftInventory.serialize()),
            InventoryUpdatePacket(InventoryIds.ARMOR, this.player.armorInventory.serialize())
        ]);
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

    handleMovementPacket(pk) {
        if (this.player.externalInventory) this.forceCloseContainer();
        if (Math.abs(this.player.x - pk.x) + Math.abs(this.player.y - pk.y) > 1.5) {
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
                if (this.player.breakingEndAt - Date.now() > 100) return this.sendBlock(x, y);
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

        if (this.player.attributes.gamemode !== 1) this.player.world.breakBlock(x, y, handItem);
        else this.player.world.setBlock(x, y, Ids.AIR);
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

        //if (this.player.attributes.gamemode > 1 || !this.player.world.canPlaceBlockAt(this.player, x, y)) return this.sendBlock(x, y);

        const handItem = this.player.getHandItem();

        if (!handItem || !isBlockItem(handItem.id)) return this.sendBlock(x, y);

        if (this.player.attributes.gamemode !== 1) {
            handItem.count--;
            if (handItem.count <= 0) this.player.playerInventory.removeIndex(this.player.handIndex);
            this.dirtyIndexes[InventoryIds.PLAYER].add(this.player.handIndex);
        }

        this.player.world.setBlock(x, y, handItem.id, handItem.meta);
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
        for (const p of S_Server.getPlayers()) {
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
        this.dirtyIndexes[InventoryIds.CRAFT].add(4);
    };

    handleCraftingTable() {
        if (this.player.externalInventoryType !== ContainerIds.CRAFTING_TABLE) return;
        const inv = this.player.externalInventory;
        const crafting = findCrafting([
            [inv.contents[0], inv.contents[1], inv.contents[2]],
            [inv.contents[3], inv.contents[4], inv.contents[5]],
            [inv.contents[6], inv.contents[7], inv.contents[8]]
        ]);
        if (crafting) inv.setIndex(9, crafting.result.evaluate());
        else inv.removeIndex(9);
        this.dirtyIndexes[InventoryIds.EXTERNAL].add(9);
    };

    computeCombineTransaction(inv1, inv2, index1, index2, item1, item2) {
        if (!item1) return false;
        if (!item2) return this.computeSwapTransaction(inv1, inv2, index1, index2, item1, item2);
        if (!item1.equals(item2, false, true)) return false;
        const maxStack = getItemMaxStack(item1.id);
        const putting = Math.min(maxStack - item2.count, item1.count);
        if (putting <= 0) return false;
        item1.count -= putting;
        item2.count += putting;
        if (item1.count <= 0) inv1.removeIndex(index1);
        return true;
    };

    computeSwapTransaction(inv1, inv2, index1, index2, item1, item2) {
        inv1.setIndex(index1, item2);
        inv2.setIndex(index2, item1);
        return true;
    };

    handleInventoryTransactionPacket(packet) {
        _TA(
            packet.id1, "number",
            packet.id2, "number",
            packet.index1, "uint",
            packet.index2, "uint",
            packet.transactionType, "number"
        );

        const {id1, id2, index1, index2, transactionType} = packet;

        if (![
            TransactionTypes.SWAP,
            TransactionTypes.COMBINE,
            TransactionTypes.SPLIT, // todo: make this fixed to a type like: { from: pos, to: pos, amount: int }
            TransactionTypes.PUT_ONE
        ].includes(transactionType)) throw new Error("Invalid transaction.");

        if (
            (id1 === id2 && index1 === index2)
            || (id1 === InventoryIds.CRAFT && index1 === 4)
            || (id1 === InventoryIds.EXTERNAL && this.player.externalInventoryType === ContainerIds.CRAFTING_TABLE && index1 === 9)
        ) return;
        const inv1 = this.player.getInventory(id1);
        const inv2 = this.player.getInventory(id2);

        if (index1 >= inv1.size || index2 >= inv2.size) return;

        const item1 = inv1.contents[index1];
        const item2 = inv2.contents[index2];

        if (!item1 && !item2) return;

        if (id2 === InventoryIds.CRAFT && index2 === 4) {
            if (!item2) return;
            if (item1 && (!item1.equals(item2, false, true) || item1.count >= getItemMaxStack(item1.id))) return;
            const crafting = findCrafting([
                [inv2.contents[0], inv2.contents[1]],
                [inv2.contents[2], inv2.contents[3]]
            ]);
            if (!crafting) return;
            const success = this.computeCombineTransaction(inv2, inv1, index2, index1, item2, item1);
            this.dirtyIndexes[InventoryIds.CRAFT].add(4);
            if (!success) {
                this.player.playerInventory.add(item2);
                if (item2.count > 0) {
                    this.player.world.dropItem(this.player.x, this.player.y, item2.clone());
                    item2.count = 0;
                }
            }
            for (const desc of crafting.recipe.flat(1)) {
                inv2.removeDesc(desc);
            }
            this.dirtyIndexes[id1].add(index1);
            this.handleCraftInventory();
            return;
        }

        if (id2 === InventoryIds.EXTERNAL && this.player.externalInventoryType === ContainerIds.CRAFTING_TABLE && index2 === 9) {
            if (!item2) return;
            if (item1 && (!item1.equals(item2, false, true) || item1.count >= getItemMaxStack(item1.id))) return;
            const crafting = findCrafting([
                [inv2.contents[0], inv2.contents[1], inv2.contents[2]],
                [inv2.contents[3], inv2.contents[4], inv2.contents[5]],
                [inv2.contents[6], inv2.contents[7], inv2.contents[8]]
            ]);
            if (!crafting) return;
            const success = this.computeCombineTransaction(inv2, inv1, index2, index1, item2, item1);
            this.dirtyIndexes[InventoryIds.EXTERNAL].add(9);
            if (!success) {
                this.player.playerInventory.add(item2);
                if (item2.count > 0) {
                    this.player.world.dropItem(this.player.x, this.player.y, item2.clone());
                    item2.count = 0;
                }
            }
            for (const f of crafting.recipe.flat(1)) {
                if (!f) continue;
                inv2.removeDesc(f);
            }
            this.dirtyIndexes[id1].add(index1);
            this.handleCraftingTable();
            return;
        }

        if (transactionType === TransactionTypes.SWAP && !this.computeSwapTransaction(
            inv1, inv2, index1, index2, item1, item2
        )) return;

        if (transactionType === TransactionTypes.COMBINE && !this.computeCombineTransaction(
            inv1, inv2, index1, index2, item1, item2
        )) return;

        if (transactionType === TransactionTypes.SPLIT) {
            if (item2) return;
            const it = item1.clone();
            it.count = Math.floor(it.count / 2);
            item1.count -= it.count;
            if (item1.count <= 0) inv1.removeIndex(index1);
            inv2.setIndex(index2, it);
        }

        if (transactionType === TransactionTypes.PUT_ONE) {
            if (!item1 || (item2 && !item1.equals(item2, false, true))) return;
            const maxStack = getItemMaxStack(item1.id);
            if (item2 && item2.count >= maxStack) return;
            if (!item2) {
                const it = item1.clone();
                it.count = 1;
                inv2.setIndex(index2, it);
            } else item2.count++;
            item1.count--;
            if (item1.count <= 0) inv1.removeIndex(index1);
        }

        if (id1 === InventoryIds.CRAFT || id2 === InventoryIds.CRAFT) {
            this.handleCraftInventory();
        }

        if (this.player.externalInventoryType === ContainerIds.CRAFTING_TABLE && (id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL)) {
            this.handleCraftingTable();
        }

        this.dirtyIndexes[id1].add(index1);
        this.dirtyIndexes[id2].add(index2);
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

        const item = inv.contents[index];

        if (!item || item.count < count) return;

        item.count -= count;
        if (item.count <= 0) inv.removeIndex(index);

        const drop = item.clone();
        drop.count = count;
        this.player.world.dropItem(this.player.x, this.player.y + this.player.baseBB.y2, drop, 1000, (this.player.bodyRotation ? 1 : -1) * 15, 0);

        this.dirtyIndexes[id].add(index);
    };

    handleSendMessagePacket(pk) {
        _T(pk.message, "string");
        if (!pk.message || pk.message.includes("\n")) return;
        this.player.processMessage(pk.message);
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

        if (block[0] === Ids.CRAFTING_TABLE) {
            if (this.player.externalInventory) return;
            this.dirtyIndexes[InventoryIds.EXTERNAL].clear();
            this.player.externalInventoryType = ContainerIds.CRAFTING_TABLE;
            this.player.externalInventory = new Inventory(10, this.dirtyIndexes[InventoryIds.EXTERNAL]);
            this.sendPacket(OpenContainerPacket(ContainerIds.CRAFTING_TABLE));
        }
        if (block[0] === Ids.TNT) {
            this.player.world.setBlock(x, y, Ids.AIR);
            const entity = new S_TNTEntity(this.player.world);
            entity.x = x;
            entity.y = y;
            entity.parentEntityId = this.player.id;
            this.player.world.addEntity(entity);
        }
    };

    handleCloseContainerPacket() {
        if (this.player.externalInventory) {
            for (const item of this.player.externalInventory.contents) {
                if (!item) continue;
                this.player.world.dropItem(this.player.x, this.player.y, item);
            }
            this.player.externalInventory.clear();
        }
        this.dirtyIndexes[InventoryIds.EXTERNAL].clear();
        this.player.externalInventory = this.player.externalInventoryType = null;
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
        this.sendPacket(DisconnectPacket(reason));
        this.ws.disconnect(immediate);
    };
}