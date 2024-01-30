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
    send(text, prefix, fn = "log") {
        if (text instanceof Error) text = text.stack.replaceAll("", "");
        if (typeof text !== "string") text = text.toString();
        const d = new Date;
        for (const line of text.split("\n").map(
            i => `§b[${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())}]§f ${prefix}${i}`
        )) console[fn](colorizeTextTerminal(line));
    },
    debug(text) {
        this.send(text, "§9[DEBUG] §7", "debug");
    },
    info(text) {
        this.send(text, "§7[INFO] §f", "info");
    },
    error(text) {
        this.send(text, "§c[ERROR] §c", "error");
    },
    warn(text) {
        this.send(text, "§6[WARN] §e", "warn");
    }
};