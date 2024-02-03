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
import {getLevelFromXP} from "../common/Utils.js";
import {Metadata} from "../common/metadata/Metadata.js";
import {Keyboard} from "../input/Keyboard.js";
import {clearDiv, colorizeTextHTML} from "../Utils.js";
import {Mouse} from "../input/Mouse.js";

const escMenu = document.querySelector(".esc-menu");
const pauseBtn = document.querySelector(".pause");
const chatInput = document.querySelector(".chat > input");
const healthDiv = document.querySelector(".health-attribute");
const foodDiv = document.querySelector(".food-attribute");
const breathDiv = document.querySelector(".breath-attribute");
const armorDiv = document.querySelector(".armor-attribute");
const xpDiv = document.querySelector(".xp-attribute");
const xpProgressDiv = document.querySelector(".xp-attribute > div");
const xpTextDiv = document.querySelector(".xp-attribute > div:nth-child(2)");
const actionbar = document.querySelector(".actionbar");

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

const chatHistory = [];
let chatHistoryIndex = 0;

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

let lastHealth, lastMaxHealth, lastFood, lastMaxFood, lastBreath, lastArmor, lastXP;

function toolStackRender(value, maxValue, div, cb) {
    const totalAmount = Math.ceil(maxValue / 2);
    const fullAmount = Math.floor(value / 2);
    const halfAmount = value % 2 === 0 ? 0 : 1;
    const emptyAmount = totalAmount - fullAmount - halfAmount;
    const lineAmount = Math.ceil(totalAmount / 10);

    clearDiv(div);

    let emptyRemaining = emptyAmount;
    let halfRemaining = halfAmount;

    for (let i = 0; i < lineAmount; i++) {
        const line = document.createElement("div");
        const handling = i === 0 ? totalAmount % 10 : 10;
        for (let j = 0; j < (handling || 10); j++) {
            const d = document.createElement("div");
            let img = "full";
            if (emptyRemaining-- > 0) {
                img = "empty";
            } else if (halfRemaining-- > 0) {
                img = "half";
            }
            d.style.backgroundImage = cb(img);
            line.insertAdjacentElement("afterbegin", d);
        }
        div.appendChild(line);
    }
}

let heartsBlink = 0;

export function renderHealthBar() {
    if (CServer.getGamemode() % 2 === 1) {
        healthDiv.hidden = true;
        return;
    }
    healthDiv.hidden = false;
    const maxHealth = Math.floor(CServer.getMaxHealth());
    const health = Math.min(Math.ceil(CServer.getHealth()), maxHealth);
    if (
        lastHealth === health
        && lastMaxHealth === maxHealth
        && (heartsBlink === 0 || Date.now() - heartsBlink < 250)
    ) return;

    if (lastHealth > health) heartsBlink = Date.now();
    else if (Date.now() - heartsBlink >= 250) heartsBlink = 0;

    lastHealth = health;
    lastMaxHealth = maxHealth;

    toolStackRender(health, maxHealth, healthDiv, t => `url("./assets/gui/heart/heart_${t}${Date.now() - heartsBlink < 250 ? "_blink" : ""}.png")`);
}

export function renderFoodBar() {
    if (CServer.getGamemode() % 2 === 1) {
        foodDiv.hidden = true;
        return;
    }
    foodDiv.hidden = false;
    const maxFood = 20;//Math.floor(CServer.getMaxFood());
    const food = Math.min(Math.floor(CServer.getFood()), maxFood);
    if (lastFood === food && lastMaxFood === maxFood) return;
    lastFood = food;
    lastMaxFood = maxFood;

    toolStackRender(food, maxFood, foodDiv, t => `url("./assets/gui/food/food_${t}.png")`);
}

export function renderBreathBar() {
    if (CServer.getGamemode() % 2 === 1) {
        breathDiv.hidden = true;
        return;
    }
    breathDiv.hidden = false;
    const breath = CServer.getBreath();
    if (lastBreath === breath) return;
    lastBreath = breath;

    if (breath >= 10) {
        clearDiv(breathDiv);
        return;
    }

    toolStackRender(breath * 2, 20, breathDiv, t => `url("./assets/${t === "empty" ? "1px.png" : `gui/breath/breath_${t}.png`}")`);
}

export function renderArmorBar() {
    if (CServer.getGamemode() % 2 === 1) {
        armorDiv.hidden = true;
        return;
    }
    armorDiv.hidden = false;
    let armor = 0;
    CServer.armorInventory.contents.forEach(item => {
        if (!item) return;
        armor += Metadata.armorPoints[item.id] ?? 0;
    });
    if (lastArmor === armor) return;
    lastArmor = armor;

    if (armor <= 0) {
        clearDiv(armorDiv);
        return;
    }

    toolStackRender(armor, 20, armorDiv, t => `url("./assets/gui/armor/armor_${t}.png")`);
}

export function renderXPBar() {
    if (CServer.getGamemode() % 2 === 1) {
        xpDiv.hidden = true;
        return;
    }
    xpDiv.hidden = false;
    const xp = CServer.getXP();
    if (lastXP === xp) return;
    lastXP = xp;

    const levelDec = getLevelFromXP(xp);
    const levelFloor = Math.floor(levelDec);
    const levelPercent = (levelDec - levelFloor) * 100;

    xpProgressDiv.style.setProperty("--progress", levelPercent + "%");
    xpTextDiv.innerText = levelFloor || "";
}

let actionbarTimeout0 = null;
let actionbarTimeout1 = null;
let actionbarAnimation = null;

export function showActionbar(text) {
    clearTimeout(actionbarTimeout0);
    clearTimeout(actionbarTimeout1);
    if (actionbarAnimation) actionbarAnimation.cancel();
    actionbar.style.opacity = "1";
    clearDiv(actionbar);
    actionbar.appendChild(colorizeTextHTML(text));
    actionbarTimeout0 = setTimeout(() => actionbarAnimation = actionbar.animate(
        {opacity: [1, 0]},
        {
            duration: 2000,
            easing: "ease-in-out",
            fill: "forwards"
        }
    ), 3000);
    actionbarTimeout1 = setTimeout(() => {
        actionbar.style.opacity = "0";
        clearDiv(actionbar);
    }, 5000);
}

function resetInput() {
    const input = document.activeElement;
    input.value = chatHistory[chatHistoryIndex] ?? "";
    requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    });
}

export function initMainUI() {
    pauseBtn.addEventListener("click", toggleEscMenu);
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
            if (key === "b" && Keyboard["f3"]) {
                C_OPTIONS.showBoundingBoxes = !C_OPTIONS.showBoundingBoxes;
                C_OPTIONS.showHitBoxes = !C_OPTIONS.showHitBoxes;
            }
            if (["f3", "tab"].includes(key)) e.preventDefault();
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
                e.preventDefault();
                if (chatHistoryIndex <= 0) return;
                chatHistoryIndex--;
                resetInput();
            } else if (key === "arrowdown") {
                e.preventDefault();
                if (chatHistoryIndex >= chatHistory.length) return;
                chatHistoryIndex++;
                resetInput();
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
        if (isAnyUIOn() || Math.abs(e.deltaY) < 5) return;
        CServer.handIndex = (CServer.handIndex + Math.sign(e.deltaY) + 9) % 9;
    });

// addEventListener("blur", () => openEscMenu());

    function onClick(e) {
        if (isAnyUIOn() || !Mouse.entity || Mouse.entity === CServer.player || !CServer.player.canTouchEntity(Mouse.entity)) return;
        ClientSession.sendTouchEntityPacket(Mouse.entity.id, e.button);
    }

    addEventListener("contextmenu", e => {
        e.preventDefault();
        onClick(e);
    });

    addEventListener("click", e => onClick(e));

    addEventListener("scroll", e => onClick(e));
}