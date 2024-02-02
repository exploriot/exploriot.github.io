import {CServer} from "../main/Game.js";
import {getItemName, getTextureURL} from "../common/metadata/Items.js";
import {Metadata} from "../common/metadata/Metadata.js";
import {getInventoryByName} from "../network/ClientPacketHandler.js";
import {Keyboard} from "../input/Keyboard.js";
import {ClientSession} from "../network/ClientSession.js";
import {ContainerIds, InventoryIds} from "../common/item/Inventory.js";
import {isEscMenuOn} from "./MainUI.js";
import {renderPlayerModel} from "../Utils.js";

const invUI = document.getElementById("player-inventory-ui");
const craftingTableUI = document.getElementById("crafting-table-ui");
const furnaceUI = document.getElementById("furnace-ui");
const chestUI = document.getElementById("chest-ui");
const doubleChestUI = document.getElementById("double-chest-ui");
const invInfoText = document.querySelector(".container-cursor-text");
const furnaceSmeltDiv = document.getElementById("furnace-smelt");
const furnaceArrowDiv = document.getElementById("furnace-arrow");
const mainDivs = document.querySelectorAll(`[data-inv]`);
const playerInvCanvas = document.querySelector(".player-inventory-canvas");
/*** @type {CanvasRenderingContext2D} */
let piCtx;
const uiView = [];
let lastHandIndex = null;
let downMain;

function onPlayerInvResize() {
    const container = playerInvCanvas.getBoundingClientRect();
    playerInvCanvas.width = container.width;
    playerInvCanvas.height = container.height;
    playerInvCanvas.imageSmoothingEnabled = false;
}

function animatePlayerInvCanvas() {
    requestAnimationFrame(animatePlayerInvCanvas);
    if (!isInventoryUIOn()) return;
    // aspect ratio: 3 / 4
    const W = playerInvCanvas.width;
    renderPlayerModel(
        piCtx, {
            SIZE: W / 2,
            renderX: 1,
            renderY: 1,
            skin: CServer.player.skin,
            bodyRotation: true,
            renderLeftArmRotation: 0,
            renderLeftLegRotation: 0,
            renderRightLegRotation: 0,
            renderRightArmRotation: 0,
            renderHeadRotation: 0,
            handItem: CServer.getHandItem()
        }
    );
}

export function initContainers() {
    for (const mainDiv of mainDivs) {
        const isDown = mainDiv.getAttribute("data-inv-down") === "true";
        const classes = isDown ? ["item", "hotbar-item"] : ["item"];
        const index = mainDiv.getAttribute("data-inv-index").split(",").map(Number);
        const h = {
            type: mainDiv.getAttribute("data-inv"),
            dep: mainDiv.parentElement.parentElement,
            divs: [],
            index
        };
        if (isDown) {
            downMain = h;
        }
        for (let i = 0; i < h.index[1] - h.index[0] + 1; i++) {
            const hotbarDiv = document.createElement("div");
            hotbarDiv.classList.add(...classes);
            const img = document.createElement("img");
            img.src = "assets/1px.png";
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

                if (
                    (inv1.type === InventoryIds.CRAFT && index1 === 4)
                    || (
                        inv1.type === InventoryIds.EXTERNAL
                        && CServer.externalInventory.extra.containerId === ContainerIds.CRAFTING_TABLE
                        && index1 === 9
                    )
                    || (
                        inv1.type === InventoryIds.EXTERNAL
                        && CServer.externalInventory.extra.containerId === ContainerIds.FURNACE
                        && index1 === 2
                    )
                ) {
                    if (!targetItem) return;
                    if (cursorItem && !targetItem.equals(cursorItem, false, true)) return;
                    const maxStack = targetItem.maxStack;
                    if (cursorItem && cursorItem.count >= maxStack) return;
                    ClientSession.sendInventoryTransactionPacket(
                        inv1.type, inv2.type,
                        index1, index2,
                        Math.min(maxStack - (cursorItem ? cursorItem.count : 0), targetItem.count)
                    );
                    return;
                }

                if (!targetItem) {
                    ClientSession.sendInventoryTransactionPacket(
                        inv2.type, inv1.type,
                        index2, index1,
                        cursorItem.count
                    );
                    return;
                }

                if (!cursorItem) {
                    ClientSession.sendInventoryTransactionPacket(
                        inv1.type, inv2.type,
                        index1, index2,
                        targetItem.count
                    );
                    return;
                }

                if (cursorItem.equals(targetItem, false, true)) {
                    const maxStack = cursorItem.maxStack;
                    ClientSession.sendInventoryTransactionPacket(
                        inv2.type, inv1.type,
                        index2, index1,
                        Math.min(maxStack - targetItem.count, cursorItem.count)
                    );
                    return;
                }

                ClientSession.sendInventoryTransactionPacket(
                    inv1.type, inv2.type,
                    index1, index2,
                    targetItem.count // count won't matter, since it's a swap action
                );
            }

            function onShiftClick() {
                const inv1 = getInventoryByName(h.type);
                const index = h.index[0] + i;
                const item = inv1.contents[index];

                if (!item) return;
                let inv2;

                if (inv1.type === InventoryIds.PLAYER) {
                    inv2 = CServer.externalInventory ?? CServer.playerInventory;
                } else {
                    inv2 = CServer.playerInventory;
                }
                ClientSession.sendItemTransferPacket(
                    inv1.type, inv2.type,
                    index, item.count
                );
            }

            function onRightClick() {
                if (Keyboard["shift"]) return onShiftClick();
                const inv1 = getInventoryByName(h.type);
                const index1 = h.index[0] + i;
                const targetItem = inv1.contents[index1];
                if (
                    (inv1.type === InventoryIds.CRAFT && index1 === 4)
                    || (
                        inv1.type === InventoryIds.EXTERNAL
                        && CServer.externalInventory.extra.containerId === ContainerIds.CRAFTING_TABLE
                        && index1 === 9
                    )
                    || (
                        inv1.type === InventoryIds.EXTERNAL
                        && CServer.externalInventory.extra.containerId === ContainerIds.FURNACE
                        && index1 === 2
                    )
                ) return onClick();

                const inv2 = CServer.cursorInventory;
                const index2 = 0;
                const cursorItem = inv2.contents[index2];

                if (cursorItem) {
                    const maxStack = cursorItem.maxStack;
                    if (targetItem && (
                        !targetItem.equals(cursorItem, false, true)
                        || targetItem.count >= maxStack
                    )) return;
                    ClientSession.sendInventoryTransactionPacket(
                        inv2.type, inv1.type,
                        index2, index1,
                        1
                    );
                    return;
                }

                if (!targetItem) return;

                ClientSession.sendInventoryTransactionPacket(
                    inv1.type, inv2.type,
                    index1, index2,
                    Math.round(targetItem.count / 2)
                );
            }

            hotbarDiv.addEventListener("click", () => {
                if (Keyboard["shift"]) onShiftClick();
                else onClick();
            });
            hotbarDiv.addEventListener("contextmenu", onRightClick);

            h.divs.push({
                div: hotbarDiv, img, count, damage, last: null
            });
        }
        uiView.push(h);
    }
}

function onAnyClick(ev) {
    if (isEscMenuOn() || !isAnyContainerOn()) return;
    if (ev.target.classList.contains("inventory-ui") && CServer.cursorInventory.contents[0]) {
        switch (ev.button) {
            case 0:
                ClientSession.sendDropItemPacket(InventoryIds.CURSOR, 0, CServer.cursorInventory.contents[0].count);
                break;
            case 2:
                ClientSession.sendDropItemPacket(InventoryIds.CURSOR, 0, 1);
                break;
        }
    }
}

export let MouseContainerPosition = null;

export function renderContainerStates() {
    if (!CServer.externalInventory || !CServer.containerState) return;
    switch (CServer.externalInventory.extra.containerId) {
        case ContainerIds.FURNACE:
            const {fuel, maxFuel, smeltProgress, smeltProgressMax, __time} = CServer.containerState;
            const dt = (Date.now() - __time) / 1000;
            const smeltPercent = (smeltProgress + dt) / smeltProgressMax * 100;
            furnaceArrowDiv.style.setProperty(
                "--progress",
                smeltPercent > 100 || !isFinite(smeltPercent) || !smeltProgress || !fuel
                    ? "0%" : smeltPercent + "%"
            );
            const fuelPercent = (fuel - dt) / maxFuel * 100;
            furnaceSmeltDiv.style.setProperty(
                "--progress",
                fuelPercent < 0 || !isFinite(fuelPercent)
                    ? "0%" : fuelPercent + "%"
            );
            break;
    }
}

export function renderHotbarPosition() {
    if (lastHandIndex === CServer.handIndex || !downMain) return;
    const from = downMain.divs[lastHandIndex];
    const to = downMain.divs[CServer.handIndex];
    if (from) from.div.classList.remove("hotbar-item-selected");
    to.div.classList.add("hotbar-item-selected");
    lastHandIndex = CServer.handIndex;
}

export function renderInventories() {
    for (const h of uiView) {
        if (h.dep.classList.contains("gone")) continue;
        const inv = getInventoryByName(h.type);
        if (!inv) continue;
        for (let i = 0; i < h.index[1] - h.index[0] + 1; i++) {
            const o = h.divs[i];
            const item = inv.contents[h.index[0] + i];
            const hasItemChanged = (o.last && !item) || (o.last && !item.equals(o.last)) || (!o.last && item);
            if (!hasItemChanged) continue;
            o.last = item ? item.serialize() : null;
            o.img.src = item ? "./" + getTextureURL(item.id, item.meta) : "assets/1px.png";
            o.count.innerText = item && item.count !== 1 ? item.count : "";
            const durability = item ? Metadata.durabilities[item.id] : 0;
            o.damage.style.width = durability ? (
                (item.nbt.damage ?? 0) === 0
                    ? 0
                    : (1 - (item.nbt.damage ?? 0) / durability) * 60
            ) + "%" : "0";
        }
    }
}

export function isAnyContainerOn() {
    return isInventoryUIOn() || isCraftingTableUIOn() || isFurnaceUIOn() || isChestUIOn() || isDoubleChestUIOn();
}

export function closeAllInventoryUIs() {
    closeInventoryUI();
    closeCraftingTableUI();
    closeFurnaceUI();
    closeChestUI();
    closeDoubleChestUI();
}

export function openInventoryUI() {
    invUI.classList.remove("gone");
}

export function closeInventoryUI() {
    invInfoText.style.opacity = "0";
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
    invInfoText.style.opacity = "0";
    craftingTableUI.classList.add("gone");
}

export function toggleCraftingTableUI() {
    if (isCraftingTableUIOn()) closeCraftingTableUI();
    else openCraftingTableUI();
}

export function isCraftingTableUIOn() {
    return !craftingTableUI.classList.contains("gone");
}

export function openFurnaceUI() {
    furnaceUI.classList.remove("gone");
}

export function closeFurnaceUI() {
    invInfoText.style.opacity = "0";
    furnaceUI.classList.add("gone");
    furnaceArrowDiv.style.animationName = " ";
    furnaceArrowDiv.style.animationDelay = "0";
    furnaceSmeltDiv.style.animationName = " ";
    furnaceSmeltDiv.style.animationDelay = "0";
    furnaceSmeltDiv.style.animationDuration = "0";
}

export function toggleFurnaceUI() {
    if (isFurnaceUIOn()) closeFurnaceUI();
    else openFurnaceUI();
}

export function isFurnaceUIOn() {
    return !furnaceUI.classList.contains("gone");
}

export function openChestUI() {
    chestUI.classList.remove("gone");
}

export function closeChestUI() {
    invInfoText.style.opacity = "0";
    chestUI.classList.add("gone");
}

export function toggleChestUI() {
    if (isChestUIOn()) closeChestUI();
    else openChestUI();
}

export function isChestUIOn() {
    return !chestUI.classList.contains("gone");
}

export function openDoubleChestUI() {
    doubleChestUI.classList.remove("gone");
}

export function closeDoubleChestUI() {
    invInfoText.style.opacity = "0";
    doubleChestUI.classList.add("gone");
}

export function toggleDoubleChestUI() {
    if (isDoubleChestUIOn()) closeDoubleChestUI();
    else openDoubleChestUI();
}

export function isDoubleChestUIOn() {
    return !doubleChestUI.classList.contains("gone");
}

export function initContainerUI() {
    piCtx = playerInvCanvas.getContext("2d");

    addEventListener("click", onAnyClick);
    addEventListener("contextmenu", onAnyClick);

    addEventListener("resize", onPlayerInvResize);

    onPlayerInvResize();

    addEventListener("mousemove", e => {
        if (!e.target.classList.contains("item")) {
            invInfoText.style.opacity = "0";
            return MouseContainerPosition = null;
        }
        const parent = e.target.parentNode;
        const viewIndex = Array.from(parent.childNodes).indexOf(e.target);
        const invName = parent.getAttribute("data-inv");
        const invIndex = parent.getAttribute("data-inv-index").split(",")[0] * 1;
        const index = viewIndex + invIndex;
        const inv = getInventoryByName(invName);
        MouseContainerPosition = {inv, index};

        const item = inv.contents[index];

        if (item && !CServer.cursorInventory.contents[0]) {
            invInfoText.innerText = getItemName(item.id, item.meta, item.nbt);
            invInfoText.style.opacity = "1";
        } else invInfoText.style.opacity = "0";
    });

    animatePlayerInvCanvas();
}