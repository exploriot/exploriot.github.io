import {getBaseBlockSize, getCanvasPosition} from "../Utils.js";
import {Mouse, recalculateMouse} from "../input/Mouse.js";
import {Ids} from "../common/metadata/Ids.js";
import {Around} from "../common/Utils.js";
import {Metadata} from "../common/metadata/Metadata.js";
import {getBlockHardness, getBlockTexture} from "../common/metadata/Blocks.js";
import {Texture} from "../loader/Texture.js";
import {isAnyUIOn} from "./MainUI.js";
import {renderCursorItemPosition, renderHotbarPosition, renderInventories} from "./ContainerUI.js";
import "./ContainerUI.js";
import {C_OPTIONS, CServer, ctx} from "../main/Game.js";

let lastRender = Date.now() - 1;
let _fps = [];

export let AnimatorFrame = 0;

export function animate() {
    AnimatorFrame = requestAnimationFrame(animate);
    const dt = (Date.now() - lastRender) / 1000;
    lastRender = Date.now();
    const size = getBaseBlockSize();
    _fps.push(Date.now());
    _fps = _fps.filter(i => i + 1000 > Date.now());
    recalculateMouse();

    ctx.clearRect(0, 0, innerWidth, innerHeight);

    const fx = Math.floor(CServer.player.x);
    const fy = Math.floor(CServer.player.y);

    const rdHalf = Math.ceil(C_OPTIONS.renderDistance / 2);
    for (let x = -rdHalf - 4; x < rdHalf + 4; x++) {
        for (let y = -rdHalf - 4; y < rdHalf + 4; y++) {
            const rx = fx + x;
            const ry = fy + y;
            const id = CServer.world.getBlock(rx, ry);
            if (id[0] === Ids.AIR) continue;
            let isShadow = true;
            if (C_OPTIONS.showCoveredBlocks) {
                isShadow = false;
            } else {
                for (const pos of Around) {
                    const id = CServer.world.getBlock(rx + pos[0], ry + pos[1])[0];
                    if (Metadata.transparent.includes(id)) {
                        isShadow = false;
                        break;
                    }
                }
            }
            const pos = getCanvasPosition(rx - 0.5, ry + 0.5, size);
            if (isShadow) {
                ctx.fillStyle = "black";
                ctx.fillRect(pos.x - 0.5, pos.y - 0.5, size + 1, size + 1);
            } else {
                const texture = getBlockTexture(id[0], id[1]);
                ctx.drawImage(Texture.get(texture).image, pos.x - 0.5, pos.y - 0.5, size + 1, size + 1);
            }
        }
    }

    const playerChunkX = CServer.player.x >> 4;
    const renderDistChunks = Math.ceil(C_OPTIONS.renderDistance / 16);
    const renderChunkMinX = playerChunkX - renderDistChunks;
    const renderChunkMaxX = playerChunkX + renderDistChunks;
    const handItem = CServer.getHandItem();
    const handItemId = handItem ? handItem.id : 0;
    for (let x = renderChunkMinX; x <= renderChunkMaxX; x++) {
        const entities = CServer.world.chunkEntities[x];
        if (entities) for (const entity of entities) {
            if (
                Math.abs(entity.x - CServer.player.x) < C_OPTIONS.renderDistance + 4 &&
                Math.abs(entity.y - CServer.player.y) < C_OPTIONS.renderDistance + 4
            ) {
                entity.render(ctx, size);
                if (C_OPTIONS.showBoundingBoxes) entity.renderBoundingBox(ctx, size);
            }
        }
        const breaks = CServer.world.breakChunks[x];
        if (breaks) for (const entity of breaks) {
            const blockId = entity.world.getBlock(entity.breaking.x, entity.breaking.y)[0];
            const hardness = getBlockHardness(blockId, handItemId, 0, 0);
            if (entity !== CServer.player) {
                entity.breakingTime += dt;
                if (entity.breakingTime >= hardness || hardness === -1) {
                    entity.removeBlockBreakProcess();
                    entity.breaking = null;
                    entity.breakingTime = 0;
                    continue;
                }
            }
            const pos = getCanvasPosition(entity.breaking.x - 0.5, entity.breaking.y + 0.5, size);
            const stage = Math.floor(entity.breakingTime / hardness * 10);
            ctx.drawImage(Texture.get("./assets/destroy/" + stage + ".png").image, pos.x, pos.y, size, size);
        }
    }

    if (!isAnyUIOn()) {
        if (CServer.world.canBreakBlockAt(CServer.player, Mouse.rx, Mouse.ry, CServer.attributes.gamemode, CServer.getHandItem())) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            const pos = getCanvasPosition(Mouse.rx - 0.5, Mouse.ry + 0.5, size);
            ctx.strokeRect(pos.x, pos.y, size, size);
        } else if (CServer.world.canPlaceBlockAt(CServer.player, Mouse.rx, Mouse.ry)) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            const pos = getCanvasPosition(Mouse.rx - 0.5, Mouse.ry + 0.5, size);
            ctx.strokeRect(pos.x, pos.y, size, size);
        }
    }

    CServer.player.render(ctx, size);
    if (C_OPTIONS.showBoundingBoxes) CServer.player.renderBoundingBox(ctx, size);

    renderInventories();
    renderCursorItemPosition();
    renderHotbarPosition();

    document.querySelector(".info").innerHTML = C_OPTIONS.isDebugMode ? `X: ${CServer.player.x}<br>
Y: ${CServer.player.y}<br>
FPS: ${_fps.length}<br>
Chunk entities: ${CServer.world.chunkEntities[CServer.player.x >> 4].length}` : "";
}