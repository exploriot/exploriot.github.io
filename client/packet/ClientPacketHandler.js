import {PacketIds} from "../common/metadata/PacketIds.js";
import {MovementPacket} from "./MovementPacket.js";
import {makeSubChunk} from "../common/world/World.js";
import {EntityIds} from "../common/metadata/Entities.js";
import {C_Player} from "../entity/Player.js";
import {CServer} from "../main/Game.js";
import {BlockPlacePacket} from "./BlockPlacePacket.js";
import {BlockBreakPacket} from "./BlockBreakPacket.js";
import {BlockBreakingUpdatePacket} from "./BlockBreakingUpdatePacket.js";
import {C_FallingBlockEntity} from "../entity/FallingBlockEntity.js";
import {PingPacket} from "./PingPacket.js";
import {ContainerIds, Inventory, InventoryIds} from "../common/item/Inventory.js";
import {Item} from "../common/item/Item.js";
import {SetHandIndexPacket} from "./SetHandIndexPacket.js";
import "./socket.io.min.js";
import {InventoryTransactionPacket} from "./InventoryTransactionPacket.js";
import {C_ItemEntity} from "../entity/ItemEntity.js";
import {AuthPacket} from "./AuthPacket.js";
import {ItemDropPacket} from "./ItemDropPacket.js";
import {SendMessagePacket} from "./SendMessagePacket.js";
import {InteractBlockPacket} from "./InteractBlockPacket.js";
import {CloseContainerPacket} from "./CloseContainerPacket.js";
import {closeCraftingTableUI, closeInventoryUI, openCraftingTableUI} from "../ui/ContainerUI.js";
import {ToggleFlightPacket} from "./ToggleFlightPacket.js";
import {C_TNTEntity} from "../entity/TNTEntity.js";
import {colorizeTextHTML} from "../common/Utils.js";

const query = new URLSearchParams(location.search);
const ip = query.get("ip");
const port = query.get("port");
const protocol = query.get("protocol");

const socket = io(protocol + "://" + ip + (port === "80" ? "" : ":" + port));

socket.on("connect", () => {
    console.info("Connected to the Socket.IO server");
});

socket.on("disconnect", () => {
    location.href = "/";
});

socket.on("packet", C_handlePacket);

const EntityCreator = {
    [EntityIds.PLAYER]: data => new C_Player(
        data.id,
        CServer.world,
        data.username
    ),
    [EntityIds.FALLING_BLOCK]: data => new C_FallingBlockEntity(
        data.id,
        CServer.world,
        data.blockId,
        data.blockMeta
    ),
    [EntityIds.ITEM]: data => new C_ItemEntity(
        data.id,
        CServer.world,
        Item.deserialize(data.item)
    ),
    [EntityIds.TNT]: data => new C_TNTEntity(
        data.id,
        CServer.world
    ),
};

function packetToEntity(data) {
    const entity = CServer.world.entityMap[data.id] ?? EntityCreator[data.type](data);
    CServer.world.entityMap[entity.id] = entity;
    Object.assign(entity, data);
    entity.handleMovement();
}

export function getInventory(id) {
    switch (id) {
        case InventoryIds.PLAYER:
            return CServer.playerInventory;
        case InventoryIds.CURSOR:
            return CServer.cursorInventory;
        case InventoryIds.ARMOR:
            return CServer.armorInventory;
        case InventoryIds.CRAFT:
            return CServer.craftInventory;
        case InventoryIds.EXTERNAL:
            return CServer.externalInventory;
    }
}

export function getInventoryByName(name) {
    switch (name) {
        case "player":
            return CServer.playerInventory;
        case "armor":
            return CServer.armorInventory;
        case "cursor":
            return CServer.cursorInventory;
        case "craft":
            return CServer.craftInventory;
        case "external":
            return CServer.externalInventory;
    }
}

export function getInventoryIdByName(name) {
    switch (name) {
        case "player":
            return InventoryIds.PLAYER;
        case "armor":
            return InventoryIds.ARMOR;
        case "cursor":
            return InventoryIds.CURSOR;
        case "craft":
            return InventoryIds.CRAFT;
        case "external":
            return InventoryIds.EXTERNAL;
    }
}

function C_handleWelcomePacket(pk) {
    CServer.player.id = pk.entityId;
    CServer.world.entityMap[pk.entityId] = CServer.player;
    CServer.chunkDistance = pk.chunkDistance;
    CServer.isWelcome = true;
    CServer.player.handleMovement();
}

function C_handleSubChunkPacket(pk) {
    const chunk = CServer.world.getChunk(pk.x);
    const subChunk = chunk[pk.y] ??= makeSubChunk();
    subChunk.set(pk.blocks);
}

function C_handleBatchPacket(batch) {
    for (const pk of batch.packets) {
        C_handlePacket(pk);
    }
}

function C_handleEntityUpdatePacket(pk) {
    packetToEntity(pk.entity);
}

function C_handleEntityMovementPacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    entity.x = pk.x;
    entity.y = pk.y;
    entity.handleMovement();
}

function C_handleEntityRemovePacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    entity.remove();
}

function C_handleBlockUpdatePacket(pk) {
    CServer.world.setBlock(pk.x, pk.y, pk.id, pk.meta);
}

function C_handleBlockBreakingUpdatePacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    if (pk.position) entity.reAddBlockBreakProcess(pk.position.x >> 4);
    else entity.removeBlockBreakProcess();
    entity.breaking = pk.position;
    entity.breakingTime = 0;
}

function C_handleDisconnectPacket(pk) {
    alert(pk.reason);
}

function C_handlePingPacket() {
    C_sendPacket(PingPacket());
}

function C_handleInventorySetIndexPacket(pk) {
    const inv = getInventory(pk.id);
    if (inv) inv.contents[pk.index] = Item.deserialize(pk.item);
}

function C_handleInventoryUpdatePacket(pk) {
    const inv = getInventory(pk.id);
    inv.contents = pk.contents.map(i => Item.deserialize(i));
}

function C_handleHandItemPacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    entity.handItem = Item.deserialize(pk.item);
}

function C_handleSetPositionPacket(pk) {
    CServer.player.x = pk.x;
    CServer.player.y = pk.y;
}

function C_handleSendMessagePacket(pk) {
    const messages = document.querySelector(".chat > .messages");
    const msg = document.createElement("div");
    msg.classList.add("msg");
    msg.innerHTML = colorizeTextHTML(pk.message);
    messages.appendChild(msg);
}

function C_handleSetAttributesPacket(pk) {
    if (pk.attributes.isFlying !== undefined && pk.attributes.isFlying !== CServer.attributes.isFlying) {
        CServer.player.vx = 0;
        CServer.player.vy = 0;
    }
    Object.assign(CServer.attributes, pk.attributes);
}

function C_handleSetHandIndexPacket(pk) {
    CServer.handIndex = pk.index;
}

function C_handleOpenContainerPacket(pk) {
    switch (pk.id) {
        case ContainerIds.CRAFTING_TABLE:
            closeInventoryUI();
            openCraftingTableUI();
            CServer.externalInventory = new Inventory(10);
            break;
    }
    CServer.externalInventoryType = pk.id;
}

function C_handleCloseContainerPacket() {
    switch (CServer.externalInventoryType) {
        case ContainerIds.CRAFTING_TABLE:
            closeCraftingTableUI();
            break;
    }
    CServer.externalInventory = CServer.externalInventoryType = null;
}

const PacketMap = {
    [PacketIds.SERVER_WELCOME]: C_handleWelcomePacket,
    [PacketIds.BATCH]: C_handleBatchPacket,
    [PacketIds.SERVER_SUB_CHUNK]: C_handleSubChunkPacket,
    [PacketIds.SERVER_ENTITY_UPDATE]: C_handleEntityUpdatePacket,
    [PacketIds.SERVER_ENTITY_MOVEMENT]: C_handleEntityMovementPacket,
    [PacketIds.SERVER_ENTITY_REMOVE]: C_handleEntityRemovePacket,
    [PacketIds.SERVER_BLOCK_UPDATE]: C_handleBlockUpdatePacket,
    [PacketIds.SERVER_BLOCK_BREAKING_UPDATE]: C_handleBlockBreakingUpdatePacket,
    [PacketIds.SERVER_DISCONNECT]: C_handleDisconnectPacket,
    [PacketIds.SERVER_PING]: C_handlePingPacket,
    [PacketIds.SERVER_INVENTORY_UPDATE]: C_handleInventoryUpdatePacket,
    [PacketIds.SERVER_HAND_ITEM]: C_handleHandItemPacket,
    [PacketIds.SERVER_INVENTORY_SET_INDEX]: C_handleInventorySetIndexPacket,
    [PacketIds.SERVER_SET_POSITION]: C_handleSetPositionPacket,
    [PacketIds.SERVER_SEND_MESSAGE]: C_handleSendMessagePacket,
    [PacketIds.SERVER_SET_ATTRIBUTES]: C_handleSetAttributesPacket,
    [PacketIds.SERVER_HAND_ITEM_INDEX]: C_handleSetHandIndexPacket,
    [PacketIds.SERVER_OPEN_CONTAINER]: C_handleOpenContainerPacket,
    [PacketIds.SERVER_CLOSE_CONTAINER]: C_handleCloseContainerPacket
};

function C_handlePacket(pk) {
    if (!PacketMap[pk.type]) {
        console.warn("Invalid packet", pk);
        return;
    }
    PacketMap[pk.type](pk);
}

export function C_sendPacket(pk) {
    socket.emit("packet", pk);
}

export function C_sendMovementPacket() {
    C_sendPacket(MovementPacket(CServer.player.x, CServer.player.y));
}

export function C_sendBlockPlacePacket(x, y, id, meta) {
    C_sendPacket(BlockPlacePacket(x, y, id, meta));
}

export function C_sendBlockBreakPacket(x, y) {
    C_sendPacket(BlockBreakPacket(x, y));
}

export function C_sendBlockBreakingUpdatePacket(x, y, state) {
    C_sendPacket(BlockBreakingUpdatePacket(x, y, state));
}

export function C_sendHandIndex() {
    C_sendPacket(SetHandIndexPacket(CServer.handIndex));
}

export function C_sendInventoryTransactionPacket(id1, id2, index1, index2, transactionType) {
    C_sendPacket(InventoryTransactionPacket(id1, id2, index1, index2, transactionType));
}

export function C_sendAuthPacket() {
    C_sendPacket(AuthPacket(CServer.username));
}

export function C_sendDropItemPacket(id, index, count) {
    C_sendPacket(ItemDropPacket(id, index, count));
}

export function C_sendMessagePacket(message) {
    C_sendPacket(SendMessagePacket(message));
}

export function C_sendInteractBlockPacket(x, y) {
    C_sendPacket(InteractBlockPacket(x, y));
}

export function C_sendCloseContainerPacket() {
    C_sendPacket(CloseContainerPacket());
    C_handleCloseContainerPacket();
}

export function C_sendToggleFlightPacket() {
    C_sendPacket(ToggleFlightPacket());
}