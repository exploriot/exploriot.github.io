import {PacketIds} from "../common/metadata/PacketIds.js";
import {makeSubChunk} from "../common/world/World.js";
import {AttributeIds, EntityIds} from "../common/metadata/Entities.js";
import {C_Player} from "../entity/Player.js";
import {CServer} from "../main/Game.js";
import {C_FallingBlockEntity} from "../entity/FallingBlockEntity.js";
import {ContainerIds, Inventory, InventoryIds} from "../common/item/Inventory.js";
import {Item} from "../common/item/Item.js";
import {C_ItemEntity} from "../entity/ItemEntity.js";
import {
    closeAllInventoryUIs,
    closeDoubleChestUI,
    openChestUI,
    openCraftingTableUI,
    openFurnaceUI
} from "../ui/ContainerUI.js";
import {C_TNTEntity} from "../entity/TNTEntity.js";
import {colorizeTextHTML} from "../common/Utils.js";
import {SoundIds} from "../common/metadata/Sounds.js";
import {ClientSession} from "./ClientSession.js";
import {dropHands} from "../ui/MainUI.js";
import {C_XPOrbEntity} from "../entity/XPOrbEntity.js";

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
    [EntityIds.XP_ORB]: data => new C_XPOrbEntity(
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

export function C_handleWelcomePacket(pk) {
    CServer.player.id = pk.entityId;
    CServer.world.entityMap[pk.entityId] = CServer.player;
    CServer.chunkDistance = pk.chunkDistance;
    CServer.isWelcome = true;
    CServer.player.handleMovement();
}

export function C_handleSubChunkPacket(pk) {
    CServer.hasAnyChunks = true;
    const chunk = CServer.world.getChunk(pk.x);
    const subChunk = chunk[pk.y] ??= makeSubChunk();
    subChunk.set(pk.blocks);
}

export function C_handleBatchPacket(batch) {
    for (const pk of batch.packets) {
        C_handlePacket(pk);
    }
}

export function C_handleEntityUpdatePacket(pk) {
    packetToEntity(pk.entity);
}

export function C_handleEntityMovementPacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    entity.x = pk.x;
    entity.y = pk.y;
    entity.handleMovement();
}

export function C_handleEntityRemovePacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    entity.remove();
}

export function C_handleBlockUpdatePacket(pk) {
    CServer.world.setBlock(pk.x, pk.y, pk.id, pk.meta);
}

export function C_handleBlockBreakingUpdatePacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    if (pk.position) entity.reAddBlockBreakProcess(pk.position.x >> 4);
    else entity.removeBlockBreakProcess();
    entity.breaking = pk.position;
    entity.breakingTime = 0;
}

export function C_handleDisconnectPacket(pk) {
    ClientSession.kickReason = pk.reason;
    ClientSession.close();
}

export function C_handlePingPacket() {
    // ClientSession.sendPing(); now it's handled in the worker
}

export function C_handleInventorySetIndexPacket(pk) {
    const inv = getInventory(pk.id);
    if (inv) inv.contents[pk.index] = Item.deserialize(pk.item);
}

export function C_handleInventoryUpdatePacket(pk) {
    if (pk.id === InventoryIds.EXTERNAL && !CServer.externalInventory) {
        C_handleOpenContainerPacket()
    }
    const inv = getInventory(pk.id);
    inv.contents = pk.contents.map(i => Item.deserialize(i));
}

export function C_handleHandItemPacket(pk) {
    const entity = CServer.world.entityMap[pk.id];
    if (!entity) return;
    entity.handItem = Item.deserialize(pk.item);
}

export function C_handleSetPositionPacket(pk) {
    CServer.player.x = pk.x;
    CServer.player.y = pk.y;
}

export function C_handleSendMessagePacket(pk) {
    const messages = document.querySelector(".chat > .messages");
    const msg = document.createElement("div");
    msg.classList.add("msg");

    msg.innerHTML = colorizeTextHTML(pk.message);
    messages.appendChild(msg);
}

export function C_handleSetAttributesPacket(pk) {
    const isF = pk.attributes[AttributeIds.IS_FLYING];
    if (isF !== undefined && isF !== CServer.attributes[AttributeIds.IS_FLYING]) {
        CServer.player.vx = 0;
        CServer.player.vy = 0;
    }
    Object.assign(CServer.attributes, pk.attributes);
}

export function C_handleSetHandIndexPacket(pk) {
    CServer.handIndex = pk.index;
}

export function C_handleOpenContainerPacket(pk) {
    let size;
    switch (pk.data.containerId) {
        case ContainerIds.CRAFTING_TABLE:
            closeAllInventoryUIs();
            openCraftingTableUI();
            size = 10;
            break;
        case ContainerIds.FURNACE:
            closeAllInventoryUIs();
            openFurnaceUI();
            size = 3;
            break;
        case ContainerIds.CHEST:
            closeAllInventoryUIs();
            openChestUI();
            size = 27;
            break;
        case ContainerIds.DOUBLE_CHEST:
            closeAllInventoryUIs();
            closeDoubleChestUI();
            size = 54;
            break;
    }
    CServer.externalInventory = new Inventory(size, InventoryIds.EXTERNAL, pk.data);
}

export function C_handleCloseContainerPacket() {
    closeAllInventoryUIs();
    if (CServer.externalInventory && [ContainerIds.CRAFTING_TABLE].includes(CServer.externalInventory.extra.containerId)) {
        dropHands();
    }
    CServer.externalInventory = null;
    CServer.containerState = null;
}

export function C_handlePlaySoundPacket(pk) {
    if (pk.isAmbient) Sound.playAmbient(SoundIds[pk.id]);
    else Sound.play(SoundIds[pk.id]);
}

export function C_handleStopSoundPacket(pk) {
    Sound.stopAmbient(SoundIds[pk.id]);
}

export function C_handleContainerStatePacket(pk) {
    CServer.containerState = pk.state;
    CServer.containerState.__time = Date.now();
}

export function C_handleUpdatePlayerListPacket(pk) {
    const div = document.querySelector(".player-list");
    let pingRate = 5;
    if (pk.ping < 3000) pingRate = 1;
    if (pk.ping > 1000) pingRate = 2;
    if (pk.ping > 500) pingRate = 3;
    if (pk.ping > 250) pingRate = 4;
    div.innerHTML = pk.list.map(i => `<div class="player"><div class="name">${i.username}</div><div class="connection" style="background-image: url('../assets/gui/connection/connection_${pingRate}.png')"></div></div>`).join("");
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
    [PacketIds.SERVER_CLOSE_CONTAINER]: C_handleCloseContainerPacket,
    [PacketIds.SERVER_PLAY_SOUND]: C_handlePlaySoundPacket,
    [PacketIds.SERVER_STOP_SOUND]: C_handleStopSoundPacket,
    [PacketIds.SERVER_CONTAINER_STATE]: C_handleContainerStatePacket,
    [PacketIds.SERVER_UPDATE_PLAYER_LIST]: C_handleUpdatePlayerListPacket
};

export function C_handlePacket(pk) {
    if (!PacketMap[pk.type]) {
        console.warn("Invalid packet", pk);
        return;
    }
    PacketMap[pk.type](pk);
}
