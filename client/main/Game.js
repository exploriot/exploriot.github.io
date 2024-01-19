// noinspection JSUnresolvedReference,JSUnusedGlobalSymbols
import "../packet/ClientPacketHandler.js";
import {C_World} from "../world/World.js";
import {Inventory} from "../common/item/Inventory.js";
import {animate} from "../ui/Animator.js";
import {C_Player} from "../entity/Player.js";
import "../common/metadata/Crafts.js";
import {C_sendAuthPacket} from "../packet/ClientPacketHandler.js";

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
    playerInventory: new Inventory(36),
    cursorInventory: new Inventory(1),
    craftInventory: new Inventory(5),
    armorInventory: new Inventory(4),
    externalInventory: null,
    externalInventoryType: null,
    handIndex: 0,
    player: null,
    world: null,
    attributes: {
        gamemode: 0,
        canFly: false,
        isFlying: false
    },
    getHandItem() {
        return this.playerInventory.contents[this.handIndex];
    }
};

CServer.world = new C_World(0);
CServer.player = new C_Player(null, CServer.world, CServer.username);
CServer.world.entityMap[CServer.player.x >> 4] = CServer.player;

animate();
CServer.world.update();

C_sendAuthPacket();