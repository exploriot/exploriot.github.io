import {
    AttributeIds,
    CREATIVE_REACH,
    EntityIds,
    PLAYER_BB,
    SURVIVAL_REACH
} from "../../../client/common/metadata/Entities.js";
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
        [AttributeIds.GAMEMODE]: 0,
        [AttributeIds.IS_FLYING]: false,
        [AttributeIds.CAN_FLY]: false,
        [AttributeIds.HEALTH]: 20,
        [AttributeIds.MAX_HEALTH]: 20,
        [AttributeIds.FOOD]: 20,
        [AttributeIds.MAX_FOOD]: 20,
        [AttributeIds.SATURATION]: 20,
        [AttributeIds.BREATH]: 10,
        [AttributeIds.XP]: 0
    };
    breaking = null;
    breakingEndAt = null;
    /*** @type {Inventory | null} */
    externalInventory = null;
    handIndex = 0;
    playerInventory = new Inventory(36, InventoryIds.PLAYER);
    cursorInventory = new Inventory(1, InventoryIds.CURSOR);
    craftInventory = new Inventory(5, InventoryIds.CRAFT);
    armorInventory = new Inventory(4, InventoryIds.ARMOR);
    dirtyAttributes = new Set;

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

    getAttribute(name) {
        return this.attributes[name];
    };

    setAttribute(name, value) {
        this.attributes[name] = value;
        this.dirtyAttributes.add(name);
    };

    isFlying() {
        return this.getAttribute(AttributeIds.IS_FLYING);
    };

    setFlying(value = true) {
        this.setAttribute(AttributeIds.IS_FLYING, value);
    };

    canFly() {
        return this.getAttribute(AttributeIds.CAN_FLY);
    };

    setCanFly(value = true) {
        this.setAttribute(AttributeIds.CAN_FLY, value);
    };

    getGamemode() {
        return this.getAttribute(AttributeIds.GAMEMODE);
    };

    setGamemode(mode) {
        this.setAttribute(AttributeIds.GAMEMODE, mode);
        this.setCanFly(mode % 2 === 1);
        if (!this.canFly()) this.setFlying(false);
        if (mode === 3) this.setFlying(true);
    };

    getXP() {
        return this.getAttribute(AttributeIds.XP);
    };

    setXP(xp) {
        this.setAttribute(AttributeIds.XP, xp);
    };

    getHealth() {
        return this.getAttribute(AttributeIds.HEALTH);
    };

    setHealth(health) {
        this.setAttribute(AttributeIds.HEALTH, health);
    };

    getMaxHealth() {
        return this.getAttribute(AttributeIds.MAX_HEALTH);
    };

    setMaxHealth(maxHealth) {
        this.setAttribute(AttributeIds.MAX_HEALTH, maxHealth);
    };

    getFood() {
        return this.getAttribute(AttributeIds.FOOD);
    };

    setFood(food) {
        this.setAttribute(AttributeIds.FOOD, food);
    };

    getMaxFood() {
        return this.getAttribute(AttributeIds.MAX_FOOD);
    };

    setMaxFood(maxFood) {
        this.setAttribute(AttributeIds.MAX_FOOD, maxFood);
    };

    getSaturation() {
        return this.getAttribute(AttributeIds.SATURATION);
    };

    setSaturation(saturation) {
        this.setAttribute(AttributeIds.SATURATION, saturation);
    };

    getBreath() {
        return this.getAttribute(AttributeIds.BREATH);
    };

    setBreath(breath) {
        this.setAttribute(AttributeIds.BREATH, breath);
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

    getHandItemId() {
        const item = this.getHandItem();
        return item ? item.id : 0;
    };

    getHandItemMeta() {
        const item = this.getHandItem();
        return item ? item.meta : 0;
    };

    getBlockReach() {
        return this.getGamemode() % 2 ? CREATIVE_REACH : SURVIVAL_REACH;
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

    update(dt) {
        if (this.getHealth() <= 0) {
            this.remove(true);
        }
        return super.update(dt);
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

    getSpawnPoint() {
        return this.world.getSafeSpawnLocation();
    };

    respawn() {
        const spawn = this.getSpawnPoint();
        this.teleport(spawn.x, spawn.y);
    };

    remove(kill = true) {
        const ext = this.externalInventory;
        if (ext && [ContainerIds.CRAFTING_TABLE].includes(ext.extra.containerId)) {
            for (let i = 0; i < ext.size - 1; i++) this.holdOrDrop(ext.contents[i]);
            ext.clear();
        }
        this.holdOrDrop(this.cursorInventory.contents[0]);
        this.cursorInventory.clear();
        if (kill) {
            const xp = this.getXP();
            if (xp > 0) this.world.dropXP(this.x, this.y, xp);
            this.setXP(0);
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
