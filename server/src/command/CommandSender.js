import {CommandLabels} from "./CommandManager.js";
import {Command} from "./Command.js";
import {clearColors} from "../../../client/common/Utils.js";
import {Terminal} from "../terminal/Terminal.js";

export class CommandSender {
    username = "";

    sendMessage(message) {
    };

    processMessage(message) {
        if (!message.startsWith("/")) {
            message = clearColors(message);
            const isOp = S_Server.isOp(this);
            S_Server.broadcastMessage((isOp ? "§c" : "") + this.username + " §f> " + message);
            return;
        }
        Terminal.send(this.username + " > " + message);
        const name = message.split(" ")[0].slice(1).toLowerCase();
        const str = message.slice(name.length + 1 + 1); // slash and the space
        const matches = str.split(/("[^"]+")/g);
        const args = matches.map(i => i[0] === '"' && i.at(-1) === '"' ? i.slice(1, -1) : i.split(" ")).flat(1);
        const command = CommandLabels[name];
        if (!command) {
            return this.sendMessage("Unknown command: " + name);
        }
        const result = command.execute(this, args);
        switch (result) {
            case Command.ERR_USAGE:
                this.sendMessage("Usage: " + command.usage);
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