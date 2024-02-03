import {C_OPTIONS, canvas, CServer, ctx} from "./main/Game.js";
import {Metadata, PreloadTextures} from "./common/metadata/Metadata.js";
import {Texture} from "./loader/Texture.js";
import {Mouse} from "./input/Mouse.js";
import {ClientSession} from "./network/ClientSession.js";
import {ColorsHex, EMOTE_LIST, EMOTE_REGEX, splitColors} from "./common/Utils.js";
import {getItemTexture} from "./common/metadata/Items.js";
import {PLAYER_BB} from "./common/metadata/Entities.js";

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

export function renderPlayerModel(
    ctx, {
        SIZE, pos, skin, bodyRotation,
        leftArmRotation, leftLegRotation, rightLegRotation, rightArmRotation,
        headRotation, handItem
    }
) {
    /*** @type {Record<string, HTMLCanvasElement>} */
    const side = skin[bodyRotation ? 0 : 1];

    const head = [
        pos.x + PLAYER_BB.x1 * SIZE, pos.y - (PLAYER_BB.y2 + 0.125) * SIZE,
        SIZE * 0.5, SIZE * 0.5
    ];

    const leg = [
        pos.x + (PLAYER_BB.x1 + 0.125) * SIZE, pos.y - (PLAYER_BB.y2 - 1.25 + 0.125) * SIZE,
        SIZE * 0.25, SIZE * 0.75
    ];

    const armBody = [
        pos.x + (PLAYER_BB.x1 + 0.125) * SIZE, pos.y - (PLAYER_BB.y2 - 0.5 + 0.125) * SIZE,
        SIZE * 0.25, SIZE * 0.75
    ];

    ctx.save();
    ctx.translate(armBody[0] + armBody[2] / 2, armBody[1]);
    ctx.rotate(leftArmRotation);
    ctx.drawImage(side.back_arm, -armBody[2] / 2, 0, armBody[2], armBody[3]);
    ctx.restore();

    ctx.save();
    ctx.translate(leg[0] + leg[2] / 2, leg[1]);
    ctx.rotate(leftLegRotation);
    ctx.drawImage(side.back_leg, -leg[2] / 2, 0, leg[2], leg[3]);
    ctx.restore();

    ctx.drawImage(side.body, ...armBody);

    ctx.save();
    ctx.translate(leg[0] + leg[2] / 2, leg[1]);
    ctx.rotate(rightLegRotation);
    ctx.drawImage(side.front_leg, -leg[2] / 2, 0, leg[2], leg[3]);
    ctx.restore();

    const item = handItem;

    ctx.save();
    ctx.translate(armBody[0] + armBody[2] / 2, armBody[1]);
    ctx.rotate(rightArmRotation);
    ctx.fillStyle = "white";
    ctx.drawImage(side.front_arm, -armBody[2] / 2, 0, armBody[2], armBody[3]);
    if (item) {
        const texture = getItemTexture(item.id, item.meta);
        if (Metadata.toolTypeItems[item.id]) {
            ctx.drawImage(
                bodyRotation ? texture.image : texture.flip(),
                bodyRotation ? -armBody[2] * 0.5 : -armBody[2] * 2.5, 0,
                SIZE * 0.8, SIZE * 0.8
            );
        } else ctx.drawImage(
            texture.image,
            bodyRotation ? 0 : -armBody[2] * 1.5, armBody[3] * 0.8,
            SIZE * 0.4, SIZE * 0.4
        );
    }
    ctx.restore();

    ctx.save();
    ctx.translate(head[0] + head[2] / 2, head[1] + head[3] * 0.55);
    ctx.rotate((headRotation + (bodyRotation ? 0 : 180)) * Math.PI / 180);
    ctx.drawImage(side.head, -head[2] / 2, -head[3] / 2, head[2], head[3]);
    head[0] -= 0.015 * SIZE;
    head[1] -= 0.015 * SIZE;
    head[3] = head[2] += 0.03 * SIZE;
    ctx.drawImage(side.head_topping, -head[2] / 2, -head[3] / 2, head[2], head[3]);
    ctx.restore();
}