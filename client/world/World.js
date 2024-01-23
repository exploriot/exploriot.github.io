import {World} from "../common/world/World.js";
import {isAnyUIOn} from "../ui/MainUI.js";
import {Keyboard} from "../input/Keyboard.js";
import {PLAYER_JUMP_ACCELERATION, PLAYER_SPEED} from "../common/metadata/Entities.js";
import {Mouse} from "../input/Mouse.js";
import {resetBlockBreaking} from "../Utils.js";
import {Ids} from "../common/metadata/Ids.js";
import {Around} from "../common/Utils.js";
import {C_OPTIONS, CServer} from "../main/Game.js";
import {getBlockHardness, isBlockItem} from "../common/metadata/Blocks.js";
import {InventoryIds} from "../common/item/Inventory.js";
import {ClientSession} from "../network/ClientSession.js";

let lastMouseX = 0;
let lastMouseY = 0;
let lastPlace = 0;
let lastDrop = 0;
let jumpT = 0;
let isPressingSpace = false;
let lastSpace = 0;

export class C_World extends World {
    breakChunks = {};
    lastUpdate = Date.now() - 1;

    update() {
        setTimeout(() => this.update());
        const adt = (Date.now() - this.lastUpdate) / 1000;
        const dt = Math.min(adt, 0.1);
        this.lastUpdate = Date.now();
        ClientSession.cleanPackets();
        if (!CServer.isWelcome) return;
        const onGround = CServer.player._onGround;
        const isFlying = CServer.attributes.isFlying;
        if (!isAnyUIOn()) {
            const speedBoost = isFlying ? 2 : 1;
            if (!Keyboard.d || !Keyboard.a) {
                if (Keyboard.a) CServer.player.move(-dt * PLAYER_SPEED * (onGround ? 1 : 0.9) * speedBoost, 0);
                if (Keyboard.d) CServer.player.move(dt * PLAYER_SPEED * (onGround ? 1 : 0.9) * speedBoost, 0);
            }
            if (!isFlying) {
                if ((Keyboard.w || Keyboard[" "]) && onGround && (jumpT -= adt) <= 0) {
                    CServer.player.vy += PLAYER_JUMP_ACCELERATION;
                    jumpT = 0.05;
                }
            } else if (!Keyboard.w || !Keyboard.s) {
                if (Keyboard.w) CServer.player.move(0, dt * PLAYER_SPEED * (onGround ? 1 : 0.9) * speedBoost);
                if (Keyboard.s) CServer.player.move(0, -dt * PLAYER_SPEED * (onGround ? 1 : 0.9) * speedBoost);
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
        if (!isFlying) CServer.player.applyGravity(dt);
        const isCreative = CServer.attributes.gamemode === 1;
        CServer.player.update(dt);
        if (!Mouse.leftDown) {
            resetBlockBreaking();
        }
        const handItem = CServer.getHandItem();
        const handItemId = handItem ? handItem.id : 0;
        if (Mouse.leftDown && !isAnyUIOn() && this.canBreakBlockAt(CServer.player, Mouse.rx, Mouse.ry, CServer.attributes.gamemode, CServer.getHandItem())) {
            if (CServer.player.breakingTime === 0 && !isCreative) {
                ClientSession.sendBlockBreakingUpdatePacket(Mouse.rx, Mouse.ry, true);
            }
            CServer.player.reAddBlockBreakProcess(Mouse.rx >> 4);
            CServer.player.breaking = {x: Mouse.rx, y: Mouse.ry};
            CServer.player.breakingTime += dt * (onGround ? 1 : 0.5);
            const blockId = this.getBlock(Mouse.rx, Mouse.ry)[0];
            const hardness = getBlockHardness(blockId, handItemId, 0, 0);
            if (CServer.player.breakingTime >= hardness || isCreative) {
                this.setBlock(Mouse.rx, Mouse.ry, Ids.AIR);
                ClientSession.sendBlockBreakPacket(Mouse.rx, Mouse.ry);
                resetBlockBreaking();
            }
        }
        if (!Mouse.rightDown) lastPlace = 0;
        if (
            !isAnyUIOn()
            && CServer.attributes.gamemode < 2
            && Date.now() - lastPlace > (CServer.attributes.gamemode % 2 === 0 ? 300 : 0)
            && Mouse.rightDown
        ) {
            if (this.canPlaceBlockAt(CServer.player, Mouse.rx, Mouse.ry)) {
                let hasBlockAround = false;
                for (const pos of Around) {
                    const block = this.getBlock(Mouse.rx + pos[0], Mouse.ry + pos[1]);
                    if (block[0] !== Ids.AIR) {
                        hasBlockAround = true;
                        break;
                    }
                }
                if (hasBlockAround) {
                    lastPlace = Date.now();
                    const handItem = CServer.getHandItem();
                    if (handItem && isBlockItem(handItem.id)) {
                        this.setBlock(Mouse.rx, Mouse.ry, handItem.id, handItem.meta);
                        ClientSession.sendBlockPlacePacket(Mouse.rx, Mouse.ry, handItem.id, handItem.meta);
                    }
                }
            } else if (
                this.canInteractBlockAt(CServer.player, Mouse.rx, Mouse.ry) &&
                Date.now() - lastPlace > 300
            ) {
                lastPlace = Date.now();
                ClientSession.sendInteractBlockPacket(Mouse.rx, Mouse.ry);
            }
        }

        const playerChunkX = CServer.player.x >> 4;
        const renderDistChunks = Math.ceil(C_OPTIONS.renderDistance / 16);
        const renderChunkMinX = playerChunkX - renderDistChunks;
        const renderChunkMaxX = playerChunkX + renderDistChunks;
        for (let x = renderChunkMinX; x <= renderChunkMaxX; x++) {
            const entities = this.chunkEntities[x];
            if (!entities) continue;
            for (const entity of entities) {
                if (
                    Math.abs(entity.x - CServer.player.x) < C_OPTIONS.renderDistance + 4 &&
                    Math.abs(entity.y - CServer.player.y) < C_OPTIONS.renderDistance + 4
                ) {
                    entity.update(dt);
                }
            }
        }
        CServer.player._onGround = CServer.player.isOnGround();

        if (CServer.canUpdateMovement) {
            ClientSession.sendMovement();
        }
        CServer.canUpdateMovement = false;

        if (CServer.attributes.gamemode % 2 !== 0 && Keyboard[" "] && !isPressingSpace) {
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