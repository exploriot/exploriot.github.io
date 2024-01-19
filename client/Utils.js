import {canvas, ctx, CServer, C_OPTIONS} from "./main/Game.js";
import {PreloadTextures} from "./common/metadata/Metadata.js";
import {getTexture} from "./texture/Texture.js";
import {C_sendBlockBreakingUpdatePacket} from "./packet/ClientPacketHandler.js";
import {Mouse} from "./input/Mouse.js";

export function getDominantSize() {
    return Math.max(innerWidth, innerHeight);
}

export function getBaseBlockSize() {
    return Math.ceil(getDominantSize() / C_OPTIONS.renderDistance);
}

function onResize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.imageSmoothingEnabled = false;
}

export function resetBlockBreaking() {
    CServer.player.removeBlockBreakProcess();
    CServer.player.breakingTime = 0;
    if (CServer.player.breaking) {
        C_sendBlockBreakingUpdatePacket(Mouse.rx, Mouse.ry, false);
        CServer.player.breaking = null;
    }
}

addEventListener("resize", onResize);

setTimeout(onResize);

export function getCanvasPosition(x, y, size) {
    return {
        x: innerWidth / 2 + (x - CServer.player.x) * size,
        y: innerHeight / 2 + (-y + CServer.player.y + CServer.player.baseBB.y2 - CServer.player.baseBB.y1 - 0.5) * size
    };
}

for (const texture of PreloadTextures) {
    getTexture("./assets/" + texture);
}