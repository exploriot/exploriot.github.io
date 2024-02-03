import {SubChunkPacket} from "../packet/SubChunkPacket.js";
import {BatchPacket} from "../packet/BatchPacket.js";
import {WelcomePacket} from "../packet/WelcomePacket.js";
import {BlockBreakingUpdatePacket} from "../packet/BlockBreakingUpdatePacket.js";
import {DisconnectPacket} from "../packet/DisconnectPacket.js";
import {EntityUpdatePacket} from "../packet/EntityUpdatePacket.js";
import {BlockUpdatePacket} from "../packet/BlockUpdatePacket.js";
import {PingPacket} from "../packet/PingPacket.js";
import {InventoryUpdatePacket} from "../packet/InventoryUpdatePacket.js";
import {InventorySetIndexPacket} from "../packet/InventorySetIndexPacket.js";
import {SetPositionPacket} from "../packet/SetPositionPacket.js";
import {SendMessagePacket} from "../packet/SendMessagePacket.js";
import {OpenContainerPacket} from "../packet/OpenContainerPacket.js";
import {CloseContainerPacket} from "../packet/CloseContainerPacket.js";
import {SetAttributesPacket} from "../packet/SetAttributesPacket.js";
import {EntityRemovePacket} from "../packet/EntityRemovePacket.js";
import {SetHandIndexPacket} from "../packet/SetHandIndexPacket.js";
import {ContainerStatePacket} from "../packet/ContainerStatePacket.js";
import {UpdatePlayerListPacket} from "../packet/UpdatePlayerListPacket.js";
import {EntityRotatePacket} from "../packet/EntityRotatePacket.js";
import {EntityAnimationPacket} from "../packet/EntityAnimationPacket.js";
import {PlaySoundPacket} from "../packet/PlaySoundPacket.js";
import {StopAmbientPacket} from "../packet/StopAmbientPacket.js";
import {PlayAmbientPacket} from "../packet/PlayAmbientPacket.js";
import {AddParticlePacket} from "../packet/AddParticlePacket.js";
import {ApplyVelocityPacket} from "../packet/ApplyVelocityPacket.js";

import {PacketIds} from "../../../client/common/metadata/PacketIds.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {SUB_CHUNK_AMOUNT} from "../../../client/common/world/World.js";
import {_T, _TA} from "../../../client/common/Utils.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {AnimationIds} from "../../../client/common/metadata/AnimationIds.js";
import {ContainerIds, Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {getBlockHardness, getBlockMetaMod, isBlockItem} from "../../../client/common/metadata/Blocks.js";
import {findCrafting} from "../../../client/common/metadata/Crafts.js";
import {S_TNTEntity} from "../entity/TNTEntity.js";
import {Item} from "../../../client/common/item/Item.js";
import {FurnaceTile} from "../tile/FurnaceTile.js";
import {S_Living} from "../entity/Living.js";
import {S_Player} from "../entity/Player.js";
import {SpawnerTile} from "../tile/SpawnerTile.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Int8Tag} from "../../../client/common/compound/int/Int8Tag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import {getEntityByName} from "../../../client/common/metadata/Entities.js";

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
    [PacketIds.CLIENT_OBTAIN_ITEM]: "handleObtainItemPacket",
    [PacketIds.CLIENT_CONSUME_ITEM]: "handleConsumeItemPacket",
    [PacketIds.CLIENT_UPDATE_ROTATION]: "handleUpdateRotationPacket",
    [PacketIds.CLIENT_TOUCH_ENTITY]: "handleTouchEntityPacket"
};

const BlockInteractMap = {
    [Ids.CRAFTING_TABLE](network, x, y) {
        let ext = network.player.externalInventory;
        if (ext) return false;
        ext = network.player.externalInventory = new Inventory(10, InventoryIds.EXTERNAL, {
            containerId: ContainerIds.CRAFTING_TABLE, x, y
        });
        network.sendPacket(OpenContainerPacket({
            containerId: ext.extra.containerId, x, y
        }));
        return true;
    },
    [Ids.FURNACE](network, x, y) {
        if (network.player.externalInventory) return false;
        network.player.world.checkTile(x, y);
        const tile = network.player.world.getTile(x, y);
        if (!tile) return;
        network.player.externalInventory = tile.container;
        tile.viewers.add(network.player);
        network.subscribedTiles.add(tile);
        network.sendPacket(OpenContainerPacket(tile.getClientExtra()));
        network.sendContainerState(tile.getClientState());
        network.sendInventory(network.player.externalInventory);
        return true;
    },
    [Ids.TNT](network, x, y) {
        const handItem = network.player.getHandItem();
        if (!handItem || handItem.id !== Ids.FLINT_AND_STEEL) return false;
        network.player.world.setBlock(x, y, Ids.AIR);
        const entity = new S_TNTEntity(network.player.world);
        entity.x = x;
        entity.y = y;
        entity.parentEntityUUID = network.player.uuid;
        network.player.world.addEntity(entity);
        return true;
    },
    [Ids.ENTITY_SPAWNER](network, x, y, item) {
        if (!item || item.id !== Ids.SPAWN_EGG) return;
        const ch = network.player.world.getTile(x, y);
        if (ch) return;
        const tile = new SpawnerTile(network.player.world, new ObjectTag({
            x: new Float32Tag(x),
            y: new Float32Tag(y),
            entityName: new StringTag(item.nbt.entityName),
            entityType: new Int8Tag(item.nbt.entityType),
            entityNBT: new StringTag(JSON.stringify(item.nbt.entityNBT))
        }));
        if (tile.init()) tile.add();
    }
};
BlockInteractMap[Ids.CHEST] = BlockInteractMap[Ids.FURNACE];

const ItemInteractMap = {
    [Ids.SPAWN_EGG](network, x, y, item) {
        return !!network.player.world.summonEntity(
            item.nbt.entityName ? getEntityByName(item.nbt.entityName) : item.nbt.entityType,
            x, y,
            item.nbt.entityNBT || {}
        );
    },
    [Ids.FLINT_AND_STEEL](network, x, y) {
        const block = network.player.world.getBlock(x, y);
        if (block[0] !== Ids.AIR) return false;
        network.player.world.placeBlock(x, y, Ids.FIRE);
        network.player.damageHandItem();
        return true;
    }
};

const PING_INTERVAL = 2000; // the time it takes the server to send the new ping
const PING_TIMEOUT = 5000; // the timeout that will result player getting kicked

export class NetworkSession {
    sentChunks = new Set;
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
        if (this.player.dirtyAttributes.size) {
            const attr = {};
            for (const name of this.player.dirtyAttributes) attr[name] = this.player.attributes[name];
            this.player.dirtyAttributes.clear();
            this.sendAttributes(attr);
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
            try {
                this.ws.send(JSON.stringify(pk));
            } catch (e) {
                console.error("Couldn't throw the packet: ", pk);
                throw e;
            }
        } else this.queuedPackets.push(pk);
    };

    sendPackets(packets, immediate = false) {
        if (packets.length === 0) return;
        if (packets.length === 1) return this.sendPacket(packets[0], immediate);
        if (immediate) {
            this.sendPacket(BatchPacket(packets), true);
        } else this.queuedPackets.push(...packets);
    };

    sendBlock(x, y) {
        const block = this.player.world.getBlock(x, y);
        this.sendPacket(BlockUpdatePacket(x, y, block[0], block[1]));
    };

    sendChunk(x, force = false) {
        if (this.sentChunks.has(x) && !force) return;
        const chunk = this.player.world.loadChunk(x);
        for (let y = 0; y < SUB_CHUNK_AMOUNT; y++) {
            const subChunk = chunk[y];
            this.sendPacket(SubChunkPacket(x, y, subChunk));
        }
        for (const e of this.player.world.getChunkEntities(x)) {
            if (e.id === this.player.id || e.isInvisible()) continue;
            this.showEntity(e);
        }
        if (!this.sentChunks.has(x)) this.sentChunks.add(x);
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

    sendAttributes(attributes = this.player.attributes) {
        this.sendPacket(SetAttributesPacket(attributes));
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
        entity.savePublicNBT();
        const data = entity.publicNBT.serialize();
        this.sendPacket(EntityUpdatePacket(data));
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

    sendPlayerList() {
        this.sendPacket(UpdatePlayerListPacket(Array.from(Server.getPlayers()).map(player => (
            {username: player.username, ping: player.session.ping}
        ))));
    };

    playSound(file, x, y, volume = 0.3) {
        this.sendPacket(PlaySoundPacket(file, x, y, volume));
    };

    playAmbient(file, volume = 0.3) {
        this.sendPacket(PlayAmbientPacket(file, volume));
    };

    stopAmbient(file) {
        this.sendPacket(StopAmbientPacket(file));
    };

    sendParticle(particleId, x, y, extra = null) {
        this.sendPacket(AddParticlePacket(particleId, x, y, extra));
    };

    sendVelocity(vx, vy) {
        this.sendPacket(ApplyVelocityPacket(vx, vy));
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
        const dist = this.player.distance(pk.x, pk.y);
        if (dist > 1.5 * Math.max(100, this.ping) / 100) {
            this.sendPosition();
            return;
        }
        const dx = Math.abs(this.player.x - pk.x);
        this.player.exhaust(dx / 60);
        this.player.x = pk.x;
        this.player.y = pk.y + 0.000000001;
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

        if (this.player.getGamemode() > 1 || !this.player.world.canBreakBlockAt(this.player, x, y)) return this.sendBlock(x, y);

        const existing = this.player.world.getBlock(x, y);
        const baseHardness = Metadata.hardness[existing[0]];
        const handItem = this.player.getHandItem();
        if (this.player.getGamemode() !== 1) {
            if (baseHardness !== 0) {
                if (!this.player.breaking) return this.sendBlock(x, y);
                if (this.player.breakingEndAt - Date.now() > 200 * Math.max(100, this.ping) / 100) return this.sendBlock(x, y);
            }
            this.player.damageHandItem();
        } else {
            this.player.broadcastPacketToViewers(EntityAnimationPacket(this.player.id, AnimationIds.HAND_SWING));
        }

        this.player.world.breakBlock(x, y, handItem, this.player.getGamemode() === 1);
    };

    handleBlockPlacePacket(pk) {
        _TA(
            pk.x, "number",
            pk.y, "number",
            pk.rotation, "number"
        );

        const x = Math.round(pk.x);
        const y = Math.round(pk.y);

        if (!this.player.world.canPlaceBlockAt(this.player, x, y)) return this.sendBlock(x, y);

        const handItem = this.player.getHandItem();

        if (!handItem || !isBlockItem(handItem.id)) return this.sendBlock(x, y);

        let {id, meta} = handItem;

        if (this.player.getGamemode() !== 1) this.player.decreaseHandItem();

        this.player.broadcastPacketToViewers(EntityAnimationPacket(this.player.id, AnimationIds.HAND_SWING));

        if (Metadata.slab.includes(id) || Metadata.stairs.includes(id)) {
            meta += (pk.rotation % 4) * getBlockMetaMod(id);
        }

        this.player.world.placeBlock(x, y, id, meta);
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

    _checkFurnaceXP(id, index) {
        if (
            id === InventoryIds.EXTERNAL
            && this.player.externalInventory.extra.containerId === ContainerIds.FURNACE
            && index === 2
            && this.player.externalInventory._tile instanceof FurnaceTile
        ) {
            const tile = this.player.externalInventory._tile;
            this.player.setXP(this.player.getXP() + tile.holdingXP);
            tile.holdingXP = 0;
        }
    };

    computeItemTransaction(id1, id2, index1, index2, count, noSwap = false) {
        // should be cancelling here, but can't, if this happens they're cheating anyway :eyes:
        if (this._firstTransactionFailCheck(id1, id2, index1, index2, count)) return false;

        const inv1 = this.player.getInventory(id1);
        const inv2 = this.player.getInventory(id2);
        const cancel = () => {
            inv1.updateIndex(index1);
            inv2.updateIndex(index2);
            return false;
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
            && (
                !(item1.id in Metadata.armorLevels)
                || Metadata.armorTypes[item1.id] - 1 !== index2
            )
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
            if (noSwap) return cancel();
            inv1.setIndex(index1, item2);
            inv2.setIndex(index2, item1);
        } else {
            // at this point, because of the if statements, both items are non-null
            // furthermore; both items have the same id, meta and nbt

            // now it should combine item1 to item2
            // since canCombine() at this point is always true, I won't check for it again
            this.computeCombine(inv1, inv2, index1, index2, item1, item2, count);
        }

        this._checkFurnaceXP(id1, index1);

        if ((id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL) && this.player.externalInventory._tile) {
            this.player.externalInventory._tile.cleanPackets();
        }

        this._endTransactionUpdate(id1, id2);

        return true;
    };

    handleInventoryTransactionPacket(packet) {
        _TA(
            packet.id1, "number",
            packet.id2, "number",
            packet.index1, "uint",
            packet.index2, "uint",
            packet.count, "uint"
        );

        this.computeItemTransaction(
            packet.id1, packet.id2,
            packet.index1, packet.index2,
            packet.count
        );
    };

    computeInventoryTransactionAt(id1, id2, inv1, index1, index2, targetCount) {
        const it = inv1.contents[index1];
        if (!it || it.count <= targetCount) return false;
        return this.computeItemTransaction(id1, id2, index1, index2, it.count - targetCount, true);

    };

    computeItemTransfer(id1, id2, index1, count) {
        const inv1 = this.player.getInventory(id1);
        const inv2 = this.player.getInventory(id2);
        const cancel = () => {
            inv1.updateIndex(index1);
            return false;
        };

        if (
            !inv1 || !inv2 || index1 >= inv1.size
            || ((id1 === InventoryIds.EXTERNAL || id2 === InventoryIds.EXTERNAL) && !this.player.externalInventory)
        ) return cancel();

        const oItem = inv1.contents[index1];

        if (!oItem || oItem.count < count) return cancel();

        if (
            (id1 === InventoryIds.CRAFT && index1 === 4)
            || (id1 === InventoryIds.EXTERNAL && this.player.externalInventory.extra.containerId === ContainerIds.CRAFTING_TABLE && index1 === 9)
        ) {
            return;
        }

        const targetCount = oItem.count - count;
        if (inv1.type === inv2.type && index1 < inv1.size / 2) for (let i = inv2.size - 1; i >= 0; i--) {
            this.computeInventoryTransactionAt(id1, id2, inv1, index1, i, targetCount);
        } else for (let i = 0; i < inv2.size; i++) {
            this.computeInventoryTransactionAt(id1, id2, inv1, index1, i, targetCount);
        }
    };

    handleItemTransferPacket(packet) {
        _TA(
            packet.id1, "number",
            packet.id2, "number",
            packet.index1, "uint",
            packet.count, "uint"
        );

        const {id1, id2, index1, count} = packet;

        this.computeItemTransfer(id1, id2, index1, count);
    };

    handleHandItemPacket(packet) {
        _T(packet.index, "uint");
        if (packet.index > 9) throw new Error("Invalid hand index.");
        if (this.player.handIndex === packet.index) return;
        this.player.handIndex = packet.index;
        this.player.playerInventory.updateIndex(packet.index);
    };

    handleItemDropPacket(packet) {
        _TA(
            packet.id, "uint",
            packet.index, "uint",
            packet.count, "uint"
        );

        const {id, index, count} = packet;

        if (this.player.getGamemode() === 3 || count <= 0) return;

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
        this.player.world.dropItem(this.player.x, this.player.y + this.player.baseBB.y2, drop, 1, (this.player.rotation > -90 && this.player.rotation < 90 ? 1 : -1) * 3, 0);
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
        const item = this.player.getHandItem();

        const interaction = BlockInteractMap[block[0]];
        if (!interaction) {
            if (!item) return;
            const itemInteraction = ItemInteractMap[item.id];
            if (!itemInteraction || !itemInteraction(this, x, y, item)) return;
            if (this.player.getGamemode() !== 1) this.player.decreaseHandItem();
        } else if (!interaction(this, x, y, item)) return;

        this.player.broadcastPacketToViewers(EntityAnimationPacket(this.player.id, AnimationIds.HAND_SWING));
    };

    handleCloseContainerPacket() {
        let ext = this.player.externalInventory;
        if (ext && [ContainerIds.CRAFTING_TABLE].includes(ext.extra.containerId)) {
            for (let i = 0; i < ext.size - 1; i++) this.player.holdOrDrop(ext.contents[i]);
            ext.clear();
        }
        this.player.externalInventory = null;
        for (const sub of this.subscribedTiles) {
            sub.viewers.delete(this.player);
        }
        this.subscribedTiles.clear();
    };

    handleToggleFlightPacket() {
        if (!this.player.canFly() || this.player.getGamemode() === 3) return;
        this.player.setFlying(!this.player.isFlying());
    };

    handleObtainItemPacket(pk) {
        _TA(
            pk.item, "object",
            pk.invId, "number",
            pk.invIndex, "number"
        );

        _TA(
            pk.item.id, "number",
            pk.item.meta, "number",
            pk.item.count, "number",
            pk.item.nbt, "object"
        );

        if (this.player.getGamemode() !== 1 || pk.item.id === Ids.AIR) return;

        const item = new Item(
            pk.item.id,
            pk.item.meta % getBlockMetaMod(pk.item.id),
            pk.item.count,
            pk.item.nbt
        );

        const handItem = this.player.getHandItem();

        this.player.playerInventory.setIndex(this.player.handIndex, item);

        this.player.playerInventory.add(handItem); // add it back
    };

    handleConsumeItemPacket() {
        const item = this.player.getHandItem();
        if (!item) return;
        const food = Metadata.edible[item.id];
        if (food) {
            if (this.player.getGamemode() % 2 === 1) return;
            const currentFood = this.player.getFood();
            const maxFood = this.player.getMaxFood();
            if (currentFood >= maxFood) return;
            this.player.setFood(Math.min(maxFood, currentFood + food))
            // this.player.setSaturation(this.player.getSaturation() + Math.ceil(food * 1.5));
            this.player.decreaseHandItem();
            return;
        }
        const armor = Metadata.armorTypes[item.id];
        if (armor) {
            this.computeItemTransaction(InventoryIds.PLAYER, InventoryIds.ARMOR, this.player.handIndex, armor - 1, 1);
            return;
        }
    };

    handleUpdateRotationPacket(pk) {
        _T(pk.rotation, "number");

        this.player.rotation = pk.rotation;

        this.player.broadcastPacketToViewers(EntityRotatePacket(this.player.id, pk.rotation));
    };

    handleTouchEntityPacket(pk) {
        _TA(
            pk.entityId, "uint",
            pk.button, "uint"
        );

        const entity = this.player.world.entityMap[pk.entityId];
        if (!entity || entity === this.player || ![0, 2].includes(pk.button)) return;

        if (pk.button === 0) {
            if (!(entity instanceof S_Living)) return;
            entity.knockFrom(this.player.x);
            entity.damage(!this.player.isFlying() && !this.player.isOnGround() && this.player.y < this.player.fallY ? 2 : 1);
            return;
        } else {
            // player decided to right-click an entity for some reason, doing nothing (for now)
        }
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