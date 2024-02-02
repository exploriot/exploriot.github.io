import {BASE_BLOCK_SIZE} from "../Utils.js";
import {CServer} from "../main/Game.js";

export let Mouse = {leftDown: false, rightDown: false, middleDown: false, pageX: 0, pageY: 0, x: 0, y: 0, rx: 0, ry: 0};

export function recalculateMouse() {
    Mouse.x = (Mouse.pageX - innerWidth / 2) / BASE_BLOCK_SIZE + CServer.player.x;
    Mouse.y = (-Mouse.pageY + innerHeight / 2) / BASE_BLOCK_SIZE + CServer.player.y + CServer.player.baseBB.y2 - CServer.player.baseBB.y1 - 0.5;
    Mouse.rx = Math.round(Mouse.x);
    Mouse.ry = Math.round(Mouse.y);
    const chunkEntities = CServer.world.getChunkEntities(Mouse.x >> 4);
    Mouse.entity = chunkEntities ? chunkEntities.find(i => {
        if (i === CServer.player) return;
        i.recalculateBoundingBox();
        return i.bb.isCollidingWithDot(Mouse.x, Mouse.y);
    }) : null;
}

export function getMouseRotation() {
    const dx = Mouse.x - Mouse.rx;
    const dy = Mouse.y - Mouse.ry;
    return (dx > 0 ? (dy > 0 ? 3 : 0) : (dy > 0 ? 2 : 1));
}

export function initMouse() {
    addEventListener("mousedown", e => {
        switch (e.button) {
            case 0:
                Mouse.leftDown = true;
                break;
            case 1:
                Mouse.middleDown = true;
                break;
            case 2:
                Mouse.rightDown = true;
                break;
        }
    });

    addEventListener("mousemove", e => {
        CServer.canUpdateMouse = true;
        Mouse.pageX = e.pageX;
        Mouse.pageY = e.pageY;
        CServer.canUpdateRotation = true;
    });

    addEventListener("mouseup", e => {
        switch (e.button) {
            case 0:
                Mouse.leftDown = false;
                break;
            case 1:
                Mouse.middleDown = false;
                break;
            case 2:
                Mouse.rightDown = false;
                break;
        }
    });

    addEventListener("blur", () => {
        Mouse.leftDown = false;
        Mouse.rightDown = false;
        Mouse.middleDown = false;
    });
}