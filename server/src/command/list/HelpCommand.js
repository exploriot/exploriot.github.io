import {Commands} from "../CommandManager.js";
import {AdvancedCommand} from "../AdvancedCommand.js";

export class HelpCommand extends AdvancedCommand {
    constructor() {
        super(
            "help",
            "Opens the help menu.",
            ["?"]
        );
    };

    executor = {
        ""(sender) {
            sender.sendMessage("§e--- Help Menu ---");
            for (const command of Commands) {
                sender.sendMessage(`§b/${command.name} - ${command.description}`);
            }
        },
        "<command>"(sender, [cmd]) {
            sender.sendMessage("§e--- Help /" + cmd.name + " ---");
            sender.sendMessage("§bName: §a" + cmd.name);
            sender.sendMessage("§bDescription: §a" + cmd.description);
            sender.sendMessage("§bAliases: §a" + cmd.aliases.join(", "));
            sender.sendMessage("§bUsage:");
            sender.sendMessage(cmd.usageMessage.split("\n").map(i => `§a${i}`).join("\n"));
        }
    };
}