import {C_OPTIONS, CServer} from "../main/Game.js";
import {
    closeInventoryUI,
    isAnyContainerOn,
    isChestUIOn,
    isCraftingTableUIOn,
    isDoubleChestUIOn,
    isFurnaceUIOn,
    isInventoryUIOn,
    MouseContainerPosition,
    openInventoryUI
} from "./ContainerUI.js";
import {ClientSession} from "../network/ClientSession.js";
import {InventoryIds} from "../common/item/Inventory.js";

const escMenu = document.querySelector(".esc-menu");
const pauseBtn = document.querySelector(".pause");
const chatInput = document.querySelector(".chat > input");

export function openEscMenu() {
    escMenu.classList.remove("gone");
    pauseBtn.classList.add("gone");
}

export function closeEscMenu() {
    escMenu.classList.add("gone");
    pauseBtn.classList.remove("gone");
}

function toggleEscMenu() {
    if (isEscMenuOn()) closeEscMenu();
    else openEscMenu();
}

export function isEscMenuOn() {
    return !escMenu.classList.contains("gone");
}

export function isTypingToInput() {
    return document.activeElement !== document.body;
}

export function isAnyUIOn() {
    return isEscMenuOn() || isAnyContainerOn() || isTypingToInput();
}

pauseBtn.addEventListener("click", toggleEscMenu);

const chatHistory = [];
let chatHistoryIndex = 0;

// ["hi", "hii"]
// 2

window.AAA = n => {
    ClientSession.sendDropItemPacket(InventoryIds.CRAFT, 4, n);
};

export function dropHands() {
    const cursorItem = CServer.cursorInventory.contents[0];
    if (cursorItem) {
        ClientSession.sendItemTransferPacket(InventoryIds.CURSOR, InventoryIds.PLAYER, 0, cursorItem.count);
        ClientSession.sendDropItemPacket(InventoryIds.CURSOR, 0, cursorItem.count);
    }
    for (let i = 0; i < 4; i++) {
        const it = CServer.craftInventory.contents[i];
        if (it) {
            ClientSession.sendItemTransferPacket(InventoryIds.CRAFT, InventoryIds.PLAYER, i, it.count);
            ClientSession.sendDropItemPacket(InventoryIds.CRAFT, i, it.count);
        }
    }
}

addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (key === "escape") {
        if (isTypingToInput()) document.activeElement.blur();
        else if (isInventoryUIOn()) closeInventoryUI();
        else if (isCraftingTableUIOn()) ClientSession.sendCloseContainerPacket();
        else toggleEscMenu();
    }
    if (key === "e" && !isEscMenuOn()) {
        if (isAnyUIOn()) {
            if (isInventoryUIOn()) {
                dropHands();
                closeInventoryUI();
            } else if (isFurnaceUIOn() || isCraftingTableUIOn() || isChestUIOn() || isDoubleChestUIOn()) ClientSession.sendCloseContainerPacket();
        } else openInventoryUI();
    }
    if (isAnyContainerOn() && !isNaN(key * 1) && MouseContainerPosition) {
        const {inv: inv1, index: index1} = MouseContainerPosition;
        const index2 = key * 1 - 1;
        const inv2 = CServer.playerInventory;
        if (index1 === index2 && inv1 === inv2) return;
        const item1 = inv1.contents[index1];
        const item2 = inv2.contents[index2];
        if (!item1 && !item2) return;
        if (!item2) ClientSession.sendInventoryTransactionPacket(
            inv1.type, inv2.type,
            index1, index2,
            item1.count
        ); else ClientSession.sendInventoryTransactionPacket(
            inv2.type, inv1.type,
            index2, index1,
            item2.count
        );
    }
    if (key === "t" && !isAnyUIOn()) setTimeout(() => chatInput.focus());
    if (!isAnyUIOn()) {
        if (key * 1) CServer.handIndex = key * 1 - 1;
        if (key === "f3") C_OPTIONS.isDebugMode = !C_OPTIONS.isDebugMode;
        e.preventDefault();
    }
    const input = document.activeElement;
    if (input && input.tagName === "INPUT") {
        if (key === "enter") {
            ClientSession.sendMessagePacket(input.value);
            chatHistory.push(input.value);
            chatHistoryIndex++;
            chatHistory.splice(chatHistoryIndex, chatHistory.length - chatHistoryIndex);
            input.value = "";
        } else if (key === "arrowup") {
            if (chatHistoryIndex <= 0) return;
            chatHistoryIndex--;
            input.value = chatHistory[chatHistoryIndex];
        } else if (key === "arrowdown") {
            if (chatHistoryIndex >= chatHistory.length) return;
            chatHistoryIndex++;
            input.value = chatHistory[chatHistoryIndex] ?? "";
        }
    }
});

document.getElementById("back-btn").addEventListener("click", closeEscMenu);

document.getElementById("disconnect-btn").addEventListener("click", () => {
    location.href = "./";
});

document.getElementById("reconnect-btn").addEventListener("click", () => {
    location.reload();
});

document.getElementById("leave-btn").addEventListener("click", () => {
    location.href = "./";
});

document.getElementById("rejoin-btn").addEventListener("click", () => {
    location.reload();
});

addEventListener("wheel", e => {
    if (Math.abs(e.deltaY) < 5) return;
    CServer.handIndex = (CServer.handIndex + Math.sign(e.deltaY) + 9) % 9;
});

// addEventListener("blur", () => openEscMenu());

addEventListener("contextmenu", e => e.preventDefault());