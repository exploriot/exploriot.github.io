import {CREATIVE_REACH, EntityIds, PLAYER_BB, SURVIVAL_REACH} from "../../../client/common/metadata/Entities.js";
import {ContainerIds, Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {NetworkSession} from "../network/NetworkSession.js";
import {HandItemPacket} from "../packet/HandItemPacket.js";
import {S_BodyEntity} from "./BodyEntity.js";
import {CommandSender} from "../command/CommandSender.js";
import {extendClass} from "../Utils.js";
import {writeFileSync} from "fs";

/*** @extends CommandSender */
export class S_Player extends S_BodyEntity {
    attributes = {
        gamemode: 0,
        isFlying: false,
        canFly: false
    };
    breaking = null;
    breakingEndAt = null;
    /*** @type {Inventory | null} */
    externalInventory = null;
    /*** @type {{type: number | null, x: number | null, y: number | null}} */
    eInv = {
        type: null,
        x: null,
        y: null
    };
    handIndex = 0;
    playerInventory = new Inventory(36, InventoryIds.PLAYER);
    cursorInventory = new Inventory(1, InventoryIds.CURSOR);
    craftInventory = new Inventory(5, InventoryIds.CRAFT);
    armorInventory = new Inventory(4, InventoryIds.ARMOR);

    /**
     * @param ws
     * @param {S_World} world
     * @param username
     */
    constructor(ws, world, username) {
        super(EntityIds.PLAYER, world, PLAYER_BB);
        this.ws = ws;
        this.username = username;
        this.session = new NetworkSession(this, ws);
    };

    getInventories() {
        const list = [
            this.playerInventory,
            this.cursorInventory,
            this.craftInventory,
            this.armorInventory
        ];
        if (this.externalInventory) list.push(this.externalInventory);
        return list;
    };

    clearAllInventories() {
        for (const inv of this.getInventories()) inv.clear();
    };

    dropAllInventories() {
        for (const inv of this.getInventories()) {
            for (const item of inv.contents) {
                this.world.dropItem(this.x, this.y, item);
            }
            inv.clear();
        }
    };

    getHandItem() {
        return this.playerInventory.contents[this.handIndex];
    };

    getBlockReach() {
        return this.attributes.gamemode % 2 ? CREATIVE_REACH : SURVIVAL_REACH;
    };

    canReachBlock(x, y) {
        return (x - this.x) ** 2 + (y - this.y) ** 2 <= this.getBlockReach() ** 2;
    };

    kick(reason, immediate = false) {
        this.session.disconnect(reason ?? "You got kicked.", immediate);
    };

    getInventory(id) {
        switch (id) {
            case InventoryIds.PLAYER:
                return this.playerInventory;
            case InventoryIds.CURSOR:
                return this.cursorInventory;
            case InventoryIds.ARMOR:
                return this.armorInventory;
            case InventoryIds.CRAFT:
                return this.craftInventory;
            case InventoryIds.EXTERNAL:
                return this.externalInventory;
        }
    };

    broadcastHandItem() {
        const item = this.getHandItem();
        const pk = HandItemPacket(this.id, item ? item.serialize() : null);
        for (const viewer of this.getViewers()) {
            if (viewer === this) continue;
            viewer.session.sendPacket(pk);
        }
    };

    sendMessage(message) {
        this.session.sendMessagePacket(message);
    };

    teleport(x, y) {
        super.teleport(x, y);
        this.session.sendPosition();
    };

    setGamemode(mode) {
        this.attributes.gamemode = mode;
        this.attributes.canFly = mode % 2 === 1;
        if (!this.attributes.canFly) this.attributes.isFlying = false;
        this.session.sendAttributes();
    };

    kill() {
        super.kill();
        this.playerInventory.clear();
        this.cursorInventory.clear();
        this.armorInventory.clear();
        this.craftInventory.clear();
    };

    save() {
        writeFileSync("./players/" + this.username + ".json", JSON.stringify({
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            attributes: this.attributes,
            playerInventory: this.playerInventory.serialize(),
            cursorInventory: this.cursorInventory.serialize(),
            craftInventory: this.craftInventory.serialize(),
            armorInventory: this.armorInventory.serialize(),
            handIndex: this.handIndex
        }));
    };

    holdOrDrop(item) {
        if (!item) return;
        this.playerInventory.add(item);
        if (item.count > 0) {
            this.world.dropItem(this.x, this.y, item);
        }
    };

    remove() {
        for (const item of this.craftInventory.contents) this.holdOrDrop(item);
        this.craftInventory.clear();
        for (const item of this.cursorInventory.contents) this.holdOrDrop(item);
        this.cursorInventory.clear();
        const ext = this.externalInventory;
        if (ext && [ContainerIds.CRAFTING_TABLE].includes(ext.extra.containerId)) {
            for (let i = 0; i < ext.size - 1; i++) { // -1 is for not giving the resulted item to the player
                this.holdOrDrop(ext.contents[i]);
            }
            ext.clear();
        }
        super.remove();
    };

    serialize() {
        return {
            id: this.id,
            type: this.type,
            username: this.username,
            x: this.x,
            y: this.y
        };
    };
}

extendClass(S_Player, CommandSender);
