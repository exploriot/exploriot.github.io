// noinspection JSUnresolvedReference,JSUnusedGlobalSymbols
import "../network/ClientPacketHandler.js";
import {C_World} from "../world/World.js";
import {Inventory, InventoryIds} from "../common/item/Inventory.js";
import {animate} from "../ui/Animator.js";
import {C_Player} from "../entity/Player.js";
import "../common/metadata/Crafts.js";
import {AttributeIds} from "../common/metadata/Entities.js";

// todo: head looking at mouse

export const canvas = document.querySelector("canvas");
export const ctx = canvas.getContext("2d");

export const C_OPTIONS = {
    username: localStorage.getItem("__block__game__username__") || "Steve",
    renderDistance: 20,
    showCoveredBlocks: false,
    showBoundingBoxes: false,
    showHitBoxes: false,
    isDebugMode: false
};

export const CServer = {
    username: C_OPTIONS.username,
    chunkDistance: null,
    canUpdateMovement: false,
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
    player: null,
    world: null,
    attributes: {},
    getHandItem() {
        return this.playerInventory.contents[this.handIndex];
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
CServer.player = new C_Player(null, CServer.world, CServer.username);
CServer.world.entityMap[CServer.player.x >> 4] = CServer.player;

animate();
CServer.world.update();