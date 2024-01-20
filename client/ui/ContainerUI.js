import {CServer} from "../main/Game.js";
import {getItemTexture} from "../common/metadata/Items.js";
import {
    C_sendInventoryTransactionPacket,
    getInventoryByName,
    getInventoryIdByName
} from "../packet/ClientPacketHandler.js";
import {InventoryIds} from "../common/item/Inventory.js";
import {TransactionTypes} from "../common/metadata/PacketIds.js";
import {Mouse} from "../input/Mouse.js";
import {Metadata} from "../common/metadata/Metadata.js";

const invUI = document.getElementById("player-inventory-ui");
const craftingTableUI = document.getElementById("crafting-table-ui");
const cursorInv = document.querySelector(".cursor-inventory");
const mainDivs = document.querySelectorAll(`[data-inv]`);
const uiView = [];
let lastHandIndex = null;
let downMain;

for (const mainDiv of mainDivs) {
    const isDown = mainDiv.getAttribute("data-inv-down") === "true";
    const classes = isDown ? ["item", "hotbar-item"] : ["item"];
    const index = mainDiv.getAttribute("data-inv-index").split(",").map(Number);
    const h = {
        type: mainDiv.getAttribute("data-inv"),
        dep: (mainDiv.getAttribute("data-inv-dep") ?? "").split(","),
        divs: [],
        index,
    };
    if (isDown) {
        downMain = h;
    }
    for (let i = 0; i < h.index[1] - h.index[0] + 1; i++) {
        const hotbarDiv = document.createElement("div");
        hotbarDiv.classList.add(...classes);
        const img = document.createElement("img");
        img.src = "./assets/1px.png";
        const count = document.createElement("div");
        count.classList.add("count");
        const damage = document.createElement("div");
        damage.classList.add("damage");
        hotbarDiv.appendChild(img);
        hotbarDiv.appendChild(count);
        hotbarDiv.appendChild(damage);
        mainDiv.appendChild(hotbarDiv);

        function onClick() {
            const inv1 = getInventoryByName(h.type);
            const index1 = h.index[0] + i;
            const targetItem = inv1.contents[index1];

            const inv2 = CServer.cursorInventory;
            const index2 = 0;
            const cursorItem = inv2.contents[index2];

            if (!targetItem && !cursorItem) return;

            C_sendInventoryTransactionPacket(
                InventoryIds.CURSOR,
                getInventoryIdByName(h.type),
                index2,
                index1,
                targetItem && cursorItem && cursorItem.equals(targetItem, false, true)
                    ? TransactionTypes.COMBINE
                    : TransactionTypes.SWAP
            );
        }

        function onSplitClick() {
            const inv1 = getInventoryByName(h.type);
            const index1 = h.index[0] + i;
            const targetItem = inv1.contents[index1];

            const inv2 = CServer.cursorInventory;
            const index2 = 0;
            const cursorItem = inv2.contents[index2];

            if (cursorItem) {
                C_sendInventoryTransactionPacket(
                    InventoryIds.CURSOR,
                    getInventoryIdByName(h.type),
                    index2,
                    index1,
                    TransactionTypes.PUT_ONE
                );
                return;
            }

            if (!targetItem) return;

            C_sendInventoryTransactionPacket(
                getInventoryIdByName(h.type),
                InventoryIds.CURSOR,
                index1,
                index2,
                TransactionTypes.SPLIT
            );
        }

        hotbarDiv.addEventListener("click", onClick);
        hotbarDiv.addEventListener("contextmenu", onSplitClick);

        h.divs.push({
            div: hotbarDiv, img, count, damage, last: null
        });
    }
    uiView.push(h);
}

export function renderCursorItemPosition() {
    cursorInv.style.left = Mouse.pageX + "px";
    cursorInv.style.top = Mouse.pageY + "px";
}

export function renderHotbarPosition() {
    if (lastHandIndex === CServer.handIndex) return;
    const from = downMain.divs[lastHandIndex];
    const to = downMain.divs[CServer.handIndex];
    if (from) from.div.classList.remove("hotbar-item-selected");
    to.div.classList.add("hotbar-item-selected");
    lastHandIndex = CServer.handIndex;
}

export function renderInventories() {
    for (const h of uiView) {
        const inv = getInventoryByName(h.type);
        if (!inv) continue;
        for (let i = 0; i < h.index[1] - h.index[0] + 1; i++) {
            const o = h.divs[i];
            const item = inv.contents[h.index[0] + i];
            const hasItemChanged = (o.last && !item) || (o.last && !item.equals(o.last)) || (!o.last && item);
            if (!hasItemChanged) continue;
            o.last = item ? item.serialize() : null;
            o.img.src = item ? "./" + getItemTexture(item.id, item.meta) : "./assets/1px.png";
            o.count.innerText = item && item.count !== 1 ? item.count : "";
            const durability = item ? Metadata.durabilities[item.id] : 0;
            o.damage.style.width = durability ? ((1 - (item.nbt.damage ?? 0) / durability) * 60) + "%" : "0";
        }
    }
}

export function openInventoryUI() {
    invUI.classList.remove("gone");
}

export function closeInventoryUI() {
    invUI.classList.add("gone");
}

export function toggleInventoryUI() {
    if (isInventoryUIOn()) closeInventoryUI();
    else openInventoryUI();
}

export function isInventoryUIOn() {
    return !invUI.classList.contains("gone");
}

export function openCraftingTableUI() {
    craftingTableUI.classList.remove("gone");
}

export function closeCraftingTableUI() {
    craftingTableUI.classList.add("gone");
}

export function toggleCraftingTableUI() {
    if (isCraftingTableUIOn()) closeCraftingTableUI();
    else openCraftingTableUI();
}

export function isCraftingTableUIOn() {
    return !craftingTableUI.classList.contains("gone");
}