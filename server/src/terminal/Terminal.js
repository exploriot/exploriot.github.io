import {stdin} from "node:process";
import {createInterface} from "node:readline/promises";
import {colorizeTextTerminal} from "../../../client/common/Utils.js";
import {ConsoleCommandSender} from "../command/ConsoleCommandSender.js";

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
    ConsoleCommandSender.processMessage("/" + cmd);
    rl.pause();
    setTimeout(loopCommandReader);
}

export const Terminal = {
    send(text) {
        console.log(colorizeTextTerminal(text));
    },
    error(error) {
        this.send("§6An error occurred.\n§4" + error.stack);
    }
};