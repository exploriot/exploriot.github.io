import {CommandLabels} from "./CommandManager.js";
import {Command} from "./Command.js";
import {clearColors} from "../../../client/common/Utils.js";
import {Terminal} from "../terminal/Terminal.js";

export class CommandSender {
    username = "";

    sendMessage(message) {
    };

    processMessage(message) {
        const isOp = Server.isOp(this);
        if (!message.startsWith("/")) {
            message = clearColors(message);
            Server.broadcastMessage(`<${isOp ? "§c" : ""}${this.username}§f> ${message}`);
            return;
        }
        if (this !== _ConsoleCommandSender) Terminal.info(`<${isOp ? "§c" : ""}${this.username}§f> ${message}`);
        const name = message.split(" ")[0].slice(1).toLowerCase();
        const str = message.slice(name.length + 1 + 1); // slash and the space
        const matches = str.split(/("[^"]+")/g);
        const args = str ? matches.map(i => i[0] === '"' && i.at(-1) === '"' ? i.slice(1, -1) : i.split(" ")).flat(1) : [];
        const command = CommandLabels[name];
        if (!command) {
            return this.sendMessage("Unknown command: " + name);
        }
        const result = command.permission && !isOp ? Command.ERR_PERMISSION : command.execute(this, args);
        switch (result) {
            case Command.ERR_USAGE:
                this.sendMessage("§cInvalid usage!\n" + command.usageMessage.split("\n").map(i => `§c${i}`).join("\n"));
                break;
            case Command.ERR_PERMISSION:
                this.sendMessage("You don't have permission to run this command!");
                break;
            case Command.ERR_INVALID:
                this.sendMessage("Unknown command: " + name);
                break;
        }
    };
}