import {
    AttributeIds,
    CREATIVE_REACH,
    EntityIds,
    PLAYER_BB,
    SURVIVAL_REACH
} from "../../../client/common/metadata/Entities.js";
import {existsSync, mkdirSync, writeFileSync} from "fs";
import {ContainerIds, Inventory, InventoryIds} from "../../../client/common/item/Inventory.js";
import {NetworkSession} from "../network/NetworkSession.js";
import {HandItemPacket} from "../packet/HandItemPacket.js";
import {extendClass} from "../Utils.js";
import {GameRules} from "../../../client/common/metadata/GameRules.js";
import {S_Living} from "./Living.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Int8Tag} from "../../../client/common/compound/int/Int8Tag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {BoolTag} from "../../../client/common/compound/BoolTag.js";
import {Terminal} from "../terminal/Terminal.js";
import {InventoryTag} from "../../../client/common/compound/InventoryTag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import DefaultSkin from "../../../client/main/DefaultSkin.js";
import {Item} from "../../../client/common/item/Item.js";
import {ItemTag} from "../../../client/common/compound/ItemTag.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {CommandSender} from "../command/CommandSender.js";

/**
 * @extends CommandSender
 * @property {Record<number, any>} attributes
 * @property {number} handIndex
 * @property {Inventory} playerInventory
 * @property {Inventory} cursorInventory
 * @property {Inventory} craftInventory
 * @property {Inventory} armorInventory
 * @property {number} fallY
 * @property {number} naturalRegenTimer
 * @property {number} starveTimer
 * @property {number} rotation
 * @property {Record<string, {x: number, y: number}>} spawnPoints
 * @property {undefined} worldName
 */
export class S_Player extends S_Living {
    static TYPE = EntityIds.PLAYER;
    static BOUNDING_BOX = PLAYER_BB;

    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        attributes: new ObjectTag({
            [AttributeIds.GAMEMODE]: new Int8Tag(0),
            [AttributeIds.IS_FLYING]: new BoolTag(false),
            [AttributeIds.CAN_FLY]: new BoolTag(false),
            [AttributeIds.HEALTH]: new Float32Tag(20),
            [AttributeIds.MAX_HEALTH]: new Float32Tag(20),
            [AttributeIds.FOOD]: new Float32Tag(20),
            [AttributeIds.MAX_FOOD]: new Float32Tag(25),
            [AttributeIds.SATURATION]: new Float32Tag(5),
            [AttributeIds.BREATH]: new Float32Tag(20),
            [AttributeIds.XP]: new Float32Tag(0)
        }),
        worldName: new StringTag(""),
        handIndex: new Int8Tag(0),
        playerInventory: new InventoryTag(new Inventory(36, InventoryIds.PLAYER)),
        cursorInventory: new InventoryTag(new Inventory(1, InventoryIds.CURSOR)),
        craftInventory: new InventoryTag(new Inventory(5, InventoryIds.CRAFT)),
        armorInventory: new InventoryTag(new Inventory(4, InventoryIds.ARMOR)),
        fallY: new Float32Tag(0),
        naturalRegenTimer: new Float32Tag(0),
        starveTimer: new Float32Tag(0),
        spawnPoints: new ObjectTag
    }).combine(S_Living.NBT_PRIVATE_STRUCTURE);

    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        username: new StringTag("Steve"),
        skinData: new StringTag(""),
        rotation: new Float32Tag(0),
        handItem: new ItemTag(new Item(Ids.AIR))
    }).combine(S_Living.NBT_PUBLIC_STRUCTURE);

    dirtyAttributes = new Set;
    breaking = null;
    breakingEndAt = null;
    /*** @type {Inventory | null} */
    externalInventory = null;
    eyeHeight = 1.5;

    /**
     * @param ws
     * @param {ObjectTag} initNBT
     */
    constructor(ws, initNBT = new ObjectTag) {
        super(null, initNBT);
        this.ws = ws;
        this.session = new NetworkSession(this, ws);
        const world = Server.worlds.find(i => i.name === this.worldName);
        delete this.worldName;
        this.username = ws.username;
        this.world = world ?? Server.getDefaultWorld();
        this.skinData = ws.skinData || DefaultSkin;

        if (!world) {
            Terminal.warn(this.username + "'s world couldn't be found. Using the default.");
            const loc = this.getSpawnPoint();
            this.x = loc.x;
            this.y = loc.y;
        }
    };

    decreaseHandItem(amount = 1) {
        this.playerInventory.decreaseItemAt(this.handIndex, amount);
    };

    damageHandItem(amount = 1) {
        this.playerInventory.damageItemAt(this.handIndex, amount);
    };

    applyVelocity(vx, vy) {
        if (this.isFlying()) return;
        this.session.sendVelocity(vx, vy);
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
        if (this.getGamemode() === mode) return;
        this.setAttribute(AttributeIds.GAMEMODE, mode);
        this.setCanFly(mode % 2 === 1);
        if (!this.canFly()) this.setFlying(false);
        if (mode === 3) {
            this.setFlying(true);
            this.broadcastDespawn();
        } else this.broadcastEntity();
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

    isInvisible() {
        return this.getGamemode() === 3;
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
        for (const viewer of this.getPlayerViewers()) {
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
            && this.world.getGameRule(GameRules.NATURAL_REGENERATION)
            && (this.naturalRegenTimer += dt) > (food >= maxFood ? 1 : 4)
        ) {
            this.naturalRegenTimer = 0;
            const heal = Math.min(maxHealth - health, 1);
            this.setHealth(health + heal);
            this.setFood(Math.max(0, food - heal / 3));
        }
        if (food <= 0 && (this.starveTimer += dt) > 4) {
            this.starveTimer = 0;
            this.damage(1);
        }
        return super.update(dt);
    };

    exhaust(amount) {
        if (this.getGamemode() % 2 === 1) return;
        const food = this.getFood();
        if (food <= 0) return;
        this.setFood(Math.max(0, food - amount));
    };

    damage(hp) {
        if (this.getGamemode() % 2 === 1) return;
        super.damage(hp);
    };

    onFall(fallDistance) {
        if (fallDistance < 3.5 || !this.world.getGameRule(GameRules.FALL_DAMAGE)) return;
        this.damage(fallDistance - 3);
        this.world.playSound("assets/sounds/damage/fall" + (fallDistance > 8 ? "big" : "small") + ".ogg", this.x, this.y);
    };

    save() {
        this.saveNBT();
        if (!existsSync("./players")) mkdirSync("./players");
        writeFileSync("./players/" + this.username + ".nbt", this.nbt.toBuffer());
    };

    holdOrDrop(item) {
        if (!item) return;
        this.playerInventory.add(item);
        if (item.count > 0) {
            this.world.dropItem(this.x, this.y, item);
        }
    };

    getSpawnPoint(world = this.world) {
        const sp = this.spawnPoints[world.name];
        return sp ?? this.world.getSafeSpawnLocation();
    };

    setSpawnPoint(x, y, world = this.world) {
        this.spawnPoints[world.name] = {x, y};
    };

    respawn() {
        this.setHealth(this.getMaxHealth());
        this.setXP(0);
        this.setFood(this.getMaxFood());
        this.setSaturation(5);
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

    saveNBT() {
        this.worldName = this.world.name;
        super.saveNBT();
        delete this.worldName;
    };

    savePublicNBT() {
        this.handItem = this.getHandItem() ?? new Item(Ids.AIR);
        super.savePublicNBT();
        delete this.handItem;
    };
}

extendClass(S_Player, CommandSender);
