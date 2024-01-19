import {C_OPTIONS, CServer} from "../main/Game.js";
import {closeInventoryUI, isCraftingTableUIOn, isInventoryUIOn, openInventoryUI} from "./ContainerUI.js";
import {C_sendCloseContainerPacket, C_sendMessagePacket} from "../packet/ClientPacketHandler.js";

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
    return isEscMenuOn() || isInventoryUIOn() || isCraftingTableUIOn() || isTypingToInput();
}

pauseBtn.addEventListener("click", toggleEscMenu);

const chatHistory = [];
let chatHistoryIndex = 0;

// ["hi", "hii"]
// 2

addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    if (key === "escape") {
        if (isTypingToInput()) document.activeElement.blur();
        else if (isInventoryUIOn()) closeInventoryUI();
        else if (isCraftingTableUIOn()) C_sendCloseContainerPacket();
        else toggleEscMenu();
    }
    if (key === "e") {
        if (isAnyUIOn()) {
            if (isInventoryUIOn()) closeInventoryUI();
            else if (isCraftingTableUIOn()) C_sendCloseContainerPacket();
        } else openInventoryUI();
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
            C_sendMessagePacket(input.value);
            chatHistory.push(input.value);
            chatHistoryIndex++;
            chatHistory.splice(chatHistoryIndex, chatHistory.length - chatHistoryIndex);
            input.value = "";
        } else if (key === "arrowup") {
            input.value = chatHistory[chatHistoryIndex];
            chatHistoryIndex--;
        } else if (key === "arrowdown") {
            input.value = chatHistory[chatHistoryIndex];
            chatHistoryIndex++;
        }
    }
});

document.getElementById("back-btn").addEventListener("click", closeEscMenu);

document.getElementById("disconnect-btn").addEventListener("click", () => {
    location.href = "/";
});

addEventListener("wheel", e => {
    if (Math.abs(e.deltaY) < 5) return;
    CServer.handIndex = (CServer.handIndex + Math.sign(e.deltaY) + 9) % 9;
});

// addEventListener("blur", () => openEscMenu());

addEventListener("contextmenu", e => e.preventDefault());