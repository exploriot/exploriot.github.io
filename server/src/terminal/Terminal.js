import {stdin} from "node:process";
import {createInterface} from "node:readline/promises";
import {colorizeTextTerminal} from "../../../client/common/Utils.js";

const rl = createInterface(stdin);

let readerRunning = false;

export function startCommandReader() {
    if (readerRunning) return;
    readerRunning = true;
    loopCommandReader().then(r => r);
}

export function stopCommandReader() {
    if (!readerRunning) return;
    readerRunning = false;
    rl.pause();
}

async function loopCommandReader() {
    if (!readerRunning) return;
    rl.resume();
    const cmd = await rl.question("");
    _ConsoleCommandSender.processMessage("/" + cmd);
    rl.pause();
    setTimeout(loopCommandReader);
}

function _pad(s) {
    return s.toString().padStart(2, "0");
}

export const Terminal = {
    send(text, prefix) {
        if (text instanceof Error) text = text.stack;
        if (typeof text !== "string") text = text.toString();
        const d = new Date;
        console.log(colorizeTextTerminal(text.split("\n").map(
            i => `§b[${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())}]§f ${prefix}${i}`
        ).join("\n")));
    },
    debug(text) {
        this.send(text, "§9[DEBUG] §7");
    },
    info(text) {
        this.send(text, "§7[INFO] §f");
    },
    error(text) {
        this.send(text, "§c[ERROR] §c");
    },
    warn(text) {
        this.send(text, "§6[WARN] §e");
    }
};