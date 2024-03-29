import {BASE_BLOCK_SIZE, getCanvasPosition} from "../Utils.js";
import {getMouseRotation, Mouse, recalculateMouse} from "../input/Mouse.js";
import {Ids} from "../common/metadata/Ids.js";
import {getBlockHardness, getBlockMetaMod, getBlockTexture} from "../common/metadata/Blocks.js";
import {Texture} from "../loader/Texture.js";
import {
    isAnyUIOn,
    renderArmorBar,
    renderBreathBar,
    renderFoodBar,
    renderHealthBar,
    renderXPBar,
    showActionbar
} from "./MainUI.js";
import {renderContainerStates, renderHotbarPosition, renderInventories} from "./ContainerUI.js";
import "./ContainerUI.js";
import {C_OPTIONS, canvas, CServer, ctx} from "../main/Game.js";
import {getItemName} from "../common/metadata/Items.js";
import {Metadata} from "../common/metadata/Metadata.js";
import {Keyboard} from "../input/Keyboard.js";
import {ClientSession} from "../network/ClientSession.js";

const playerListDiv = document.querySelector(".player-list");
const infoDiv = document.querySelector(".info");
const infos = document.querySelectorAll(".info > span[data-info]");
let lastRender = Date.now() - 1;
let fpsList = [];
let fps = 60;

export let AnimatorFrame = 0;
let lastHandIndex = 0;
let lastHandItemId = 0;
let lastHandItemMeta = 0;

let dg = 0;

function renderMouseBlockAround() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const pos = getCanvasPosition(Mouse.rx - 0.5, Mouse.ry + 0.5);
    ctx.strokeRect(pos.x, pos.y, BASE_BLOCK_SIZE, BASE_BLOCK_SIZE);
}

function renderBlockAt(x, y, id, meta) {
    const pos = getCanvasPosition(x - 0.5, y + 0.5);
    const texture = getBlockTexture(id, meta);
    let img = texture.image;
    if (Metadata.slab.includes(id) || Metadata.stairs.includes(id)) {
        const mod = getBlockMetaMod(id);
        img = texture.rotate(Math.floor(meta / mod) * 90);
    }
    ctx.drawImage(img, pos.x - 0.5, pos.y - 0.5, BASE_BLOCK_SIZE + 1, BASE_BLOCK_SIZE + 1);
}

export function animate() {
    AnimatorFrame = requestAnimationFrame(animate);
    const dt = (Date.now() - lastRender) / 1000;
    dg += dt * 100;
    lastRender = Date.now();
    fpsList.push([Date.now() + 1000, 1 / dt]);
    fpsList = fpsList.filter(i => i[0] > Date.now());
    fps = fpsList.reduce((a, b) => a + b[1], 0) / fpsList.length;
    if (BASE_BLOCK_SIZE <= 0 || !CServer.isWelcome || !CServer.loadedChunks.has(CServer.player.x >> 4)) return;

    if (CServer.canUpdateMouse) recalculateMouse();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fx = Math.floor(CServer.player.x);
    const fy = Math.floor(CServer.player.y);

    const widthHalf = Math.ceil((canvas.width / BASE_BLOCK_SIZE - 1) / 2);
    const heightHalf = Math.ceil((canvas.height / BASE_BLOCK_SIZE - 1) / 2);

    //canvas.style.background = "rgba(0, 147, 233, " + (CServer.world.getTime() / 1200) + ")"

    for (let x = -widthHalf; x < widthHalf + 2; x++) {
        for (let y = -heightHalf + 1; y < heightHalf + 3; y++) {
            const rx = fx + x;
            const ry = fy + y;
            const id = CServer.world.getBlock(rx, ry);
            if (id[0] === Ids.AIR) continue;
            if (!C_OPTIONS.showCoveredBlocks && CServer.world.isBlockCovered(rx, ry)) {
                const pos = getCanvasPosition(rx - 0.5, ry + 0.5);
                ctx.fillStyle = "black";
                ctx.fillRect(pos.x - 0.5, pos.y - 0.5, BASE_BLOCK_SIZE + 1, BASE_BLOCK_SIZE + 1);
            } else {
                renderBlockAt(rx, ry, id[0], id[1]);
            }
        }
    }

    const playerChunkX = CServer.player.x >> 4;
    const renderDistChunks = Math.ceil(C_OPTIONS.renderDistance / 16);
    const renderChunkMinX = playerChunkX - renderDistChunks;
    const renderChunkMaxX = playerChunkX + renderDistChunks;
    const handItem = CServer.getHandItem();
    const handItemId = handItem ? handItem.id : 0;
    const handItemMeta = handItem ? handItem.meta : 0;
    for (let x = renderChunkMinX; x <= renderChunkMaxX; x++) {
        /*** @type {Set<C_Entity>} */
        const entities = CServer.world.getChunkEntities(x);
        for (const entity of entities) if (
            Math.abs(entity.x - CServer.player.x) < widthHalf + 0.5 &&
            Math.abs(entity.y - CServer.player.y) < heightHalf + 1.5
        ) {
            entity.render();
            if (C_OPTIONS.showBoundingBoxes) entity.renderBoundingBox();
        }

        /*** @type {Set<Particle>} */
        const particles = CServer.world.getChunkParticles(x);
        for (const particle of particles) {
            if (particle.canDespawn()) {
                particles.delete(particle);
                continue;
            }
            if (
                Math.abs(particle.x - CServer.player.x) < widthHalf + 0.5 &&
                Math.abs(particle.y - CServer.player.y) < heightHalf + 1.5
            ) particle.render();
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
            const pos = getCanvasPosition(entity.breaking.x - 0.5, entity.breaking.y + 0.5);
            const stage = Math.floor(entity.breakingTime / hardness * 10);
            ctx.drawImage(Texture.get("assets/destroy/" + stage + ".png").image, pos.x, pos.y, BASE_BLOCK_SIZE, BASE_BLOCK_SIZE);
        }
    }

    if (!isAnyUIOn()) {
        const canPlace = CServer.player.canPlaceBlockAt(Mouse.rx, Mouse.ry);
        if (!canPlace && (
            CServer.player.canBreakBlockAt(Mouse.rx, Mouse.ry)
            || CServer.player.canInteractBlockAt(Mouse.rx, Mouse.ry))
        ) renderMouseBlockAround();
        if (canPlace) {
            let meta = handItemMeta;
            if (Metadata.slab.includes(handItemId) || Metadata.stairs.includes(handItemId)) {
                meta += getMouseRotation() * getBlockMetaMod(handItemId);
            }

            ctx.save();
            // f(x: 0-500) = x/500
            // f(x: 500-1000) = 1-x/500
            // f(0) = 0
            // f(500) = 0.5
            // f(1000) = 0
            // 0.5 - abs((500 - x)/1000)
            const t = performance.now() % 1200;
            ctx.globalAlpha = 0.7 - Math.abs((600 - t) / 1200);
            renderBlockAt(Mouse.rx, Mouse.ry, handItemId, meta);
            ctx.restore();
        }
    }

    if (CServer.canUpdateRotation) {
        const headY = CServer.player.y + 1.250;
        CServer.player.rotation = -Math.atan2(Mouse.y - headY, Mouse.x - CServer.player.x) / Math.PI * 180;
        ClientSession.sendRotation();
    }
    CServer.canUpdateRotation = false;

    CServer.player.render();
    if (C_OPTIONS.showBoundingBoxes) CServer.player.renderBoundingBox();

    document.documentElement.style.setProperty("--mouse-x", Mouse.pageX + "px");
    document.documentElement.style.setProperty("--mouse-y", Mouse.pageY + "px");

    renderInventories();
    renderHotbarPosition();
    renderContainerStates();
    renderHealthBar();
    renderFoodBar();
    renderBreathBar();
    renderArmorBar();
    renderXPBar();
    if (lastHandIndex !== CServer.handIndex || lastHandItemId !== handItemId || lastHandItemMeta !== handItemMeta) {
        lastHandIndex = CServer.handIndex;
        lastHandItemId = handItemId;
        lastHandItemMeta = handItemMeta;
        if (handItem) showActionbar(getItemName(handItemId, handItemMeta, handItem.nbt));
    }
    playerListDiv.style.opacity = Keyboard["tab"] ? "1" : "0";

    if (C_OPTIONS.isDebugMode) {
        infoDiv.classList.remove("gone");
        const data = {
            x: CServer.player.x,
            y: CServer.player.y,
            fps: Math.floor(fps),
            entities: CServer.world.getChunkEntities(CServer.player.x >> 4).size
        };
        for (const inf of infos) {
            inf.innerText = data[inf.getAttribute("data-info")];
        }
    } else infoDiv.classList.add("gone");
}