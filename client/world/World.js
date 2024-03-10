import {World} from "../common/world/World.js";
import {isAnyUIOn} from "../ui/MainUI.js";
import {Keyboard} from "../input/Keyboard.js";
import {PLAYER_SPEED} from "../common/metadata/Entities.js";
import {getMouseRotation, Mouse} from "../input/Mouse.js";
import {resetBlockBreaking} from "../Utils.js";
import {Ids} from "../common/metadata/Ids.js";
import {C_OPTIONS, CServer} from "../main/Game.js";
import {getBlockHardness, isBlockItem} from "../common/metadata/Blocks.js";
import {InventoryIds} from "../common/item/Inventory.js";
import {ClientSession} from "../network/ClientSession.js";
import {Item} from "../common/item/Item.js";
import {Metadata} from "../common/metadata/Metadata.js";

let lastMouseX = 0;
let lastMouseY = 0;
let lastPlace = 0;
let lastMiddle = 0;
let lastConsume = 0;
let lastDrop = 0;
let isPressingSpace = false;
let lastSpace = 0;

export class C_World extends World {
    breakChunks = {};
    lastUpdate = Date.now() - 1;
    /*** @type {Record<number, Set<C_Entity>>} */
    chunkEntities = {};
    /*** @type {Record<number, Set<Particle>>} */
    chunkParticles = {};
    time = 0;

    /**
     * @param {number} x
     * @return {Set<Particle>}
     */
    getChunkParticles(x) {
        return this.chunkParticles[x] ??= new Set;
    };

    update() {
        setTimeout(() => this.update());
        const adt = (Date.now() - this.lastUpdate) / 1000;
        const dt = Math.min(adt, 0.1);
        this.lastUpdate = Date.now();
        ClientSession.cleanPackets();
        const player = CServer.player;
        this.time += adt;
        //console.log(this.time) todo: finish time
        if (!CServer.isWelcome || !CServer.loadedChunks.has(player.x >> 4)) return;
        const isFlying = CServer.isFlying();
        const isSpectator = CServer.getGamemode() === 3;
        const onGround = player._onGround;
        if (onGround && player.y * 2 - Math.floor(player.y * 2) < 0.001) {
            player.y = Math.floor(player.y * 2) / 2 + 0.000000001;
        }
        if (!isAnyUIOn()) {
            const isTouchingWater = CServer.player.isTouchingWater();
            const speedBoost = isFlying ? 2 : (isTouchingWater ? 0.7 : 1);
            if (isSpectator) {
                if (!Keyboard.d || !Keyboard.a) {
                    if (Keyboard.a) player.forceMove(-dt * PLAYER_SPEED * speedBoost, 0);
                    if (Keyboard.d) player.forceMove(dt * PLAYER_SPEED * speedBoost, 0);
                }
                if (!Keyboard.w || !Keyboard.s) {
                    if (Keyboard.w) player.forceMove(0, dt * PLAYER_SPEED * speedBoost);
                    if (Keyboard.s) player.forceMove(0, -dt * PLAYER_SPEED * speedBoost);
                }
            } else {
                if (!Keyboard.d || !Keyboard.a) {
                    if (Keyboard.a) {
                        player.move(-dt * PLAYER_SPEED * speedBoost, 0);
                    }
                    if (Keyboard.d) player.move(dt * PLAYER_SPEED * speedBoost, 0);
                }
                if (!isFlying) {
                    if ((Keyboard.w || Keyboard[" "])) {
                        if (isTouchingWater) {
                            player.vy = player.world.getBlock(player.x, player.y - 0.2)[0] === Ids.WATER ? 2 : 5;
                        } else player.jump();
                    }
                } else if (!Keyboard.w || !Keyboard.s) {
                    if (Keyboard.w) player.move(0, dt * PLAYER_SPEED * (onGround ? 1 : 0.9) * speedBoost);
                    if (Keyboard.s) player.move(0, -dt * PLAYER_SPEED * (onGround ? 1 : 0.9) * speedBoost);
                }
            }
            if (Keyboard.q && Date.now() - lastDrop > 250) {
                lastDrop = Date.now();
                const item = CServer.getHandItem();
                if (item && item.count > 0) {
                    ClientSession.sendDropItemPacket(InventoryIds.PLAYER, CServer.handIndex, 1);
                }
            }
        }
        if (lastMouseX !== Mouse.rx) {
            lastMouseX = Mouse.rx;
            resetBlockBreaking();
        }
        if (lastMouseY !== Mouse.ry) {
            lastMouseY = Mouse.ry;
            resetBlockBreaking();
        }
        if (!isFlying) player.applyGravity(dt);
        const isCreative = CServer.getGamemode() === 1;
        player.update(dt);
        if (!Mouse.leftDown) {
            resetBlockBreaking();
        }
        const handItem = CServer.getHandItem();
        const handItemId = handItem ? handItem.id : 0;
        const handItemMeta = handItem ? handItem.meta : 0;
        if (Mouse.leftDown && !isAnyUIOn() && player.canBreakBlockAt(Mouse.rx, Mouse.ry)) {
            if (player.breakingTime === 0 && !isCreative) {
                ClientSession.sendBlockBreakingUpdatePacket(Mouse.rx, Mouse.ry, true);
            }
            player.reAddBlockBreakProcess(Mouse.rx >> 4);
            player.breaking = {x: Mouse.rx, y: Mouse.ry};
            player.breakingTime += dt * (onGround ? 1 : 0.5);
            const blockId = this.getBlock(Mouse.rx, Mouse.ry)[0];
            const hardness = getBlockHardness(blockId, handItemId, 0, 0);
            if (player.breakingTime >= hardness || isCreative) {
                this.setBlock(Mouse.rx, Mouse.ry, Ids.AIR);
                ClientSession.sendBlockBreakPacket(Mouse.rx, Mouse.ry);
                resetBlockBreaking();
                if (isCreative) {
                    player.swingRemaining = 0.3;
                }
            }
        }
        if (!Mouse.rightDown) {
            lastPlace = 0;
            lastConsume = 0;
        }
        if (
            !isAnyUIOn()
            && Mouse.rightDown
        ) {
            if (Date.now() - lastPlace > (CServer.getGamemode() % 2 === 0 ? 300 : 0)) {
                if (player.canPlaceBlockAt(Mouse.rx, Mouse.ry)) {
                    lastPlace = Date.now();
                    if (handItem && isBlockItem(handItem.id)) {
                        player.swingRemaining = 0.3;
                        this.setBlock(Mouse.rx, Mouse.ry, handItem.id, handItem.meta);
                        ClientSession.sendBlockPlacePacket(Mouse.rx, Mouse.ry, getMouseRotation());
                    }
                } else if (
                    player.canInteractBlockAt(Mouse.rx, Mouse.ry)
                    && Date.now() - lastPlace > (CServer.getGamemode() % 2 === 0 ? 300 : 50)
                ) {
                    lastPlace = Date.now();
                    ClientSession.sendInteractBlockPacket(Mouse.rx, Mouse.ry);
                }
            }
            if (Metadata.edible[handItemId] && Date.now() - lastConsume > 300) {
                lastConsume = Date.now();
                ClientSession.sendConsumeItemPacket();
            }
        }

        if (
            !isAnyUIOn()
            && CServer.getGamemode() === 1
            && Mouse.middleDown
            && Date.now() - lastMiddle > 300
            && !this.isBlockCovered(Mouse.rx, Mouse.ry)
        ) {
            const block = this.getBlock(Mouse.rx, Mouse.ry);
            if (block[0] !== Ids.AIR && (block[0] !== handItemId || block[1] !== handItemMeta)) {
                lastMiddle = Date.now();
                ClientSession.sendObtainItemPacket(
                    new Item(block[0] === Ids.NATURAL_LOG ? Ids.LOG : block[0], block[1]),
                    InventoryIds.PLAYER,
                    CServer.handIndex
                );
            }
        }

        const playerChunkX = player.x >> 4;
        const renderDistChunks = Math.ceil(C_OPTIONS.renderDistance / 16);
        const renderChunkMinX = playerChunkX - renderDistChunks;
        const renderChunkMaxX = playerChunkX + renderDistChunks;
        for (let x = renderChunkMinX; x <= renderChunkMaxX; x++) {
            const entities = this.getChunkEntities(x);
            for (const entity of entities) {
                if (
                    Math.abs(entity.x - player.x) < C_OPTIONS.renderDistance + 4 &&
                    Math.abs(entity.y - player.y) < C_OPTIONS.renderDistance + 4
                ) {
                    entity.update(dt);
                }
            }
        }
        player._onGround = player.isOnGround();

        if (CServer.canUpdateMovement) {
            if (player._onGround && !onGround && isFlying) ClientSession.sendToggleFlightPacket();
            ClientSession.sendMovement();
        }
        CServer.canUpdateMovement = false;

        if (CServer.getGamemode() % 2 !== 0 && Keyboard[" "] && !isPressingSpace) {
            if (Date.now() - lastSpace < 300) {
                ClientSession.sendToggleFlightPacket();
                isPressingSpace = false;
            }
            lastSpace = Date.now();
        }
        isPressingSpace = Keyboard[" "];

        if (CServer.lastHandIndex !== CServer.handIndex) {
            ClientSession.sendHandIndex();
            CServer.lastHandIndex = CServer.handIndex;
        }
    };
}