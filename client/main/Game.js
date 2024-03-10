// noinspection JSUnresolvedReference,JSUnusedGlobalSymbols
import "../network/ClientPacketHandler.js";
import {C_World} from "../world/World.js";
import {Inventory, InventoryIds} from "../common/item/Inventory.js";
import {animate} from "../ui/Animator.js";
import {C_Player} from "../entity/Player.js";
import "../common/metadata/Crafts.js";
import {AttributeIds} from "../common/metadata/Entities.js";
import {initBlocks} from "../common/metadata/Blocks.js";
import {initCrafts} from "../common/metadata/Crafts.js";
import {initItems} from "../common/metadata/Items.js";
import {clearDiv, colorizeTextHTML, initTextures, onResize} from "../Utils.js";
import {initMainUI} from "../ui/MainUI.js";
import {ClientSession} from "../network/ClientSession.js";
import {initContainers, initContainerUI} from "../ui/ContainerUI.js";
import {initMouse} from "../input/Mouse.js";
import {initKeyboard} from "../input/Keyboard.js";
import DefaultSkin from "./DefaultSkin.js";

export let C_OPTIONS, CServer, canvas;
/*** @type {CanvasRenderingContext2D} */
export let ctx;

export function initGame() {
    // todo: mobile support

    const connectionText = document.querySelector(".connection-menu > .container > .text");
    canvas = document.querySelector(".game");
    ctx = canvas.getContext("2d");

    C_OPTIONS = {
        username: localStorage.getItem("__block__game__username__") || "Steve",
        skinData: localStorage.getItem("__block__game__skin__") || DefaultSkin,
        renderDistance: 20,
        showCoveredBlocks: false,
        showBoundingBoxes: false,
        showHitBoxes: false,
        isDebugMode: false,
        resolution: 1
    };

    CServer = {
        username: C_OPTIONS.username,
        skinData: C_OPTIONS.skinData,
        loadedChunks: new Set,
        chunkDistance: null,
        canUpdateMovement: false,
        canUpdateRotation: false,
        canUpdateMouse: true,
        isWelcome: false,
        lastHandIndex: 0,
        playerInventory: new Inventory(36, InventoryIds.PLAYER),
        cursorInventory: new Inventory(1, InventoryIds.CURSOR),
        craftInventory: new Inventory(5, InventoryIds.CRAFT),
        armorInventory: new Inventory(4, InventoryIds.ARMOR),
        /*** @type {Inventory | null} */
        externalInventory: null,
        containerState: null,
        handIndex: 0,
        /*** @type {C_Player | null} */
        player: null,
        dummyPlayer: null,
        /*** @type {C_World | null} */
        world: null,
        attributes: {},
        getHandItem() {
            return this.playerInventory.get(this.handIndex);
        },
        getAttribute(name) {
            return this.attributes[name] ?? null;
        },
        getHandItemId() {
            const item = this.getHandItem();
            return item ? item.id : 0;
        },
        getHandItemMeta() {
            const item = this.getHandItem();
            return item ? item.meta : 0;
        },
        isFlying() {
            return this.getAttribute(AttributeIds.IS_FLYING);
        },
        canFly() {
            return this.getAttribute(AttributeIds.CAN_FLY);
        },
        getGamemode() {
            return this.getAttribute(AttributeIds.GAMEMODE);
        },
        getXP() {
            return this.getAttribute(AttributeIds.XP);
        },
        getHealth() {
            return this.getAttribute(AttributeIds.HEALTH);
        },
        getMaxHealth() {
            return this.getAttribute(AttributeIds.MAX_HEALTH);
        },
        getFood() {
            return this.getAttribute(AttributeIds.FOOD);
        },
        getMaxFood() {
            return this.getAttribute(AttributeIds.MAX_FOOD);
        },
        getSaturation() {
            return this.getAttribute(AttributeIds.SATURATION);
        },
        getBreath() {
            return this.getAttribute(AttributeIds.BREATH);
        }
    };

    CServer.world = new C_World(0);
    CServer.player = new C_Player(null, CServer.world, CServer.username, CServer.skinData);
    CServer.player.HAS_RENDER_POS = false;
    CServer.dummyPlayer = new C_Player(null, CServer.world, CServer.username, CServer.skinData);

    animate();
    CServer.world.update();
    ClientSession.__init__();
    initContainers();
    initMainUI();
    initContainerUI();
    initMouse();
    initKeyboard();
    initItems();
    initBlocks();
    initCrafts();
    initTextures();

    addEventListener("resize", onResize);

    for (const opt of document.querySelectorAll("[data-opt]")) {
        const name = opt.getAttribute("data-opt");
        const type = opt.getAttribute("data-t") ?? "number";

        const existing = localStorage.getItem(`settings.${name}`);
        if (existing) {
            opt.value = existing;
            C_OPTIONS[name] = type === "number" ? opt.value * 1 : opt.value;
        }

        opt.addEventListener("input", () => {
            localStorage.setItem(`settings.${name}`, opt.value);
            C_OPTIONS[name] = type === "number" ? opt.value * 1 : opt.value;

            if (name === "resolution") onResize();
        });
    }

    clearDiv(connectionText);
    connectionText.appendChild(colorizeTextHTML("§aConnecting..."))

    onResize();
}

if (["game", "game.html"].includes(location.pathname.split("/").at(-1))) initGame();