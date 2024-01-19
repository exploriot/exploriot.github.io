import {CREATIVE_REACH, EntityIds, PLAYER_BB, SURVIVAL_REACH} from "../../../client/common/metadata/Entities.js";
import {Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
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
    externalInventoryType = null;
    handIndex = 0;

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
        this.playerInventory = new Inventory(36, this.session.dirtyIndexes[InventoryIds.PLAYER]);
        this.cursorInventory = new Inventory(1, this.session.dirtyIndexes[InventoryIds.CURSOR]);
        this.craftInventory = new Inventory(5, this.session.dirtyIndexes[InventoryIds.CRAFT]);
        this.armorInventory = new Inventory(4, this.session.dirtyIndexes[InventoryIds.ARMOR]);
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
        this.session.disconnect("You got kicked." + (reason ? " Reason: " + reason : ""), immediate);
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
        this.x = x;
        this.y = y;
        this.handleMovement();
        this.broadcastMovement();
        this.broadcastEntity();
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
