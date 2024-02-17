import {stdin} from "node:process";
import {createInterface} from "node:readline/promises";

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