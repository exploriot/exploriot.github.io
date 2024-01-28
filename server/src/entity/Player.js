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
import {CommandSender} from "../command/CommandSender.js";
import {extendClass} from "../Utils.js";
import {writeFileSync} from "fs";
import {GameRules} from "../../../client/common/metadata/GameRules.js";
import {S_Living} from "./Living.js";
import {Item} from "../../../client/common/item/Item.js";
import {Terminal} from "../terminal/Terminal.js";

/*** @extends CommandSender */
export class S_Player extends S_Living {
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
    fallY = null;
    naturalRegenTimer = 0;
    starveTimer = 0;
    rotation = 0;

    /**
     * @param ws
     * @param {S_World} world
     * @param {string} username
     * @param {string} skinData
     */
    constructor(ws, world, username, skinData) {
        super(EntityIds.PLAYER, world, PLAYER_BB);
        this.ws = ws;
        this.username = username;
        this.session = new NetworkSession(this, ws);
        this.skinData = skinData;
    };

    updateHandItem() {
        this.playerInventory.updateIndex(this.handIndex);
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
        this.fallY = y;
        this.session.sendPosition();
    };

    update(dt) {
        const isOnGround = this.isOnGround();
        const isFlying = this.isFlying();
        if (isOnGround) {
            this.onFall(this.fallY - this.y);
            this.fallY = this.y;
        } else if (isFlying) {
            this.fallY = this.y;
        } else {
            if (this.y > this.fallY) this.fallY = this.y;
        }

        const saturation = this.getSaturation();
        const health = this.getHealth();

        if (health <= 0) {
            this.remove(true);
            return false;
        }

        const maxHealth = this.getMaxHealth();
        const food = this.getFood();
        const maxFood = this.getMaxFood();

        if (
            food > 17
            && health < maxHealth
            && !this.world.getGameRule(GameRules.NATURAL_REGENERATION)
            && (this.naturalRegenTimer += dt) > (food >= maxFood ? 1 : 4)
        ) {
            this.naturalRegenTimer = 0;
            const heal = Math.min(maxHealth - health, 1);
            this.setHealth(health + heal);
            this.setSaturation(Math.max(0, saturation - health));
        }
        if (saturation <= 0 && food <= 0 && (this.starveTimer += dt) > 4) {
            this.starveTimer = 0;
            this.damage(1);
        }
        return super.update(dt);
    };

    useSaturation(amount) {
        const saturation = this.getSaturation();
        if (saturation > 0) {
            this.setSaturation(Math.max(0, saturation - amount));
            return;
        }
        const food = this.getFood();
        if (food <= 0) return;
        this.setFood(Math.max(0, food - amount));
    };

    damage(hp) {
        if (this.getGamemode() % 2 === 1) return;
        const newHealth = this.getHealth() - hp;
        this.setHealth(newHealth);
        if (newHealth <= 0) this.remove(true);
    };

    onFall(fallDistance) {
        if (fallDistance < 3.5 || !this.world.getGameRule(GameRules.FALL_DAMAGE)) return;
        this.damage(fallDistance - 3);
    };

    save() {
        writeFileSync("./players/" + this.username + ".json", JSON.stringify(this.serializeSave()));
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
        this.setHealth(this.getMaxHealth());
        this.setXP(0);
        this.setFood(this.getMaxFood());
        this.setSaturation(20);
        this.setBreath(10);
        const spawn = this.getSpawnPoint();
        this.teleport(spawn.x, spawn.y);
        this.broadcastHandItem();
    };

    remove(kill = true) {
        if (kill && this.getGamemode() % 2 === 1) return;
        const ext = this.externalInventory;
        if (ext && [ContainerIds.CRAFTING_TABLE].includes(ext.extra.containerId)) {
            for (let i = 0; i < ext.size - 1; i++) this.holdOrDrop(ext.contents[i]);
            ext.clear();
        }
        this.holdOrDrop(this.cursorInventory.contents[0]);
        this.cursorInventory.clear();
        for (const item of this.craftInventory.contents) this.holdOrDrop(item);
        this.craftInventory.clear();
        for (const item of this.cursorInventory.contents) this.holdOrDrop(item);
        this.cursorInventory.clear();
        if (kill) {
            const xp = this.getXP();
            if (xp > 0) this.world.dropXP(this.x, this.y, xp);
            this.setXP(0);
            this.dropAllInventories();
            this.respawn();
            return;
        }
        super.remove(kill);
    };

    static deserialize(ws, data) {
        const world = Server.worlds.find(i => i.name === data.worldName);
        const player = new S_Player(ws, world ?? Server.getDefaultWorld(), data.username, data.skinData);
        if (world) {
            player.x = data.x;
            player.y = data.y;
        } else {
            Terminal.warn(player.username + "'s world couldn't be found. Using the default.");
            const loc = world.getPlayerSpawnLocation(player.username);
            player.x = loc.x;
            player.y = loc.y;
        }
        player.vx = data.vx;
        player.vy = data.vy;
        Object.assign(player.attributes, data.attributes);
        player.playerInventory.contents = data.playerInventory.map(Item.deserialize);
        player.cursorInventory.contents = data.cursorInventory.map(Item.deserialize);
        player.craftInventory.contents = data.craftInventory.map(Item.deserialize);
        player.armorInventory.contents = data.armorInventory.map(Item.deserialize);
        player.handIndex = data.handIndex;
        player.fallY = data.fallY;
        return player;
    };

    serializeSave() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            username: this.username,
            attributes: this.attributes,
            playerInventory: this.playerInventory.serialize(),
            cursorInventory: this.cursorInventory.serialize(),
            craftInventory: this.craftInventory.serialize(),
            armorInventory: this.armorInventory.serialize(),
            handIndex: this.handIndex,
            fallY: this.fallY,
            worldName: this.world.name,
        };
    };

    serialize() {
        const item = this.getHandItem();
        return {
            id: this.id,
            type: this.type,
            username: this.username,
            skinData: this.skinData,
            rotation: this.rotation,
            handItem: item ? item.serialize() : null,
            x: this.x,
            y: this.y
        };
    };
}

extendClass(S_Player, CommandSender);
