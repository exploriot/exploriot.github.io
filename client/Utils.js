import {C_OPTIONS, canvas, CServer, ctx} from "./main/Game.js";
import {PreloadTextures} from "./common/metadata/Metadata.js";
import {Texture} from "./loader/Texture.js";
import {Mouse} from "./input/Mouse.js";
import {ClientSession} from "./network/ClientSession.js";
import {ColorsHex, EMOTE_LIST, EMOTE_REGEX, splitColors} from "./common/Utils.js";

export function getDominantSize() {
    return Math.max(innerWidth, innerHeight);
}

export function getBaseBlockSize() {
    return Math.ceil(getDominantSize() / C_OPTIONS.renderDistance);
}

export let BASE_BLOCK_SIZE = 0;

export function onResize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    ctx.imageSmoothingEnabled = false;
    BASE_BLOCK_SIZE = getBaseBlockSize();
}

export function resetBlockBreaking() {
    CServer.player.removeBlockBreakProcess();
    CServer.player.breakingTime = 0;
    if (CServer.player.breaking) {
        ClientSession.sendBlockBreakingUpdatePacket(Mouse.rx, Mouse.ry, false);
        CServer.player.breaking = null;
    }
}

export function getCanvasPosition(x, y) {
    return {
        x: innerWidth / 2 + (x - CServer.player.x) * BASE_BLOCK_SIZE,
        y: innerHeight / 2 + (-y + CServer.player.y + CServer.player.baseBB.y2 - CServer.player.baseBB.y1 - 0.5) * BASE_BLOCK_SIZE
    };
}

export function initTextures() {
    for (const texture of PreloadTextures) {
        Texture.get("assets/" + texture);
    }
}

export function colorizeTextHTML(text) { // []
    const spl = splitColors(text); // ["Hello, ", "§c", "world"]
    let style = {color: "", italic: false, bold: false, underline: false, strikethrough: false};
    const result = document.createElement("div");
    for (let i = 0; i < spl.length; i++) {
        const sp = spl[i];
        if (sp[0] === "§") {
            if (sp[1] in ColorsHex) {
                style.color = ColorsHex[sp[1]];
                continue;
            } else if (sp[1] === "s") {
                style.strikethrough = true;
                continue;
            } else if (sp[1] === "u") {
                style.underline = true;
                continue;
            } else if (sp[1] === "i") {
                style.italic = true;
                continue;
            } else if (sp[1] === "l") {
                style.bold = true;
                continue;
            }
        }
        /*** @type {string[]} */
        const emo = sp.split(EMOTE_REGEX);
        const data = emo.map(i => {
            if (EMOTE_REGEX.test(i) && EMOTE_LIST.includes(i.slice(1, -1))) return `<img src="assets/emotes/${i.slice(1, -1)}.png" width="16">`;
            return document.createTextNode(i).data;
        }).join("");
        if (!style.color) {
            result.innerText += data;
            continue;
        }
        const span = document.createElement("span");
        span.style.color = style.color;
        span.innerText = data;
        result.appendChild(span);
    }
    return result;
}

export function clearDiv(div) {
    for (const c of div.childNodes) c.remove();
}