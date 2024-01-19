import {Command} from "../Command.js";
import {Commands} from "../CommandManager.js";

export class HelpCommand extends Command {
    constructor() {
        super("help", "Opens the help menu.", "/help", ["?"]);
    };

    execute(sender, args) {
        sender.sendMessage("§e--- Help Menu ---");
        for (const command of Commands) {
            sender.sendMessage(`§b/${command.name} - ${command.description}`);
        }
    };
}