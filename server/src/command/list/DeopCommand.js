import {Command} from "../Command.js";
import {S_Server} from "../../Server.js";

export class DeopCommand extends Command {
    constructor() {
        super("deop", "De-ops players.", "/deop <player>", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        const name = args[0];
        if (!name) return Command.ERR_USAGE;
        if (!S_Server.ops.has(name)) return sender.sendMessage("This player is already not an operator.");
        S_Server.ops.delete(name);
        S_Server.saveOps();
        const player = S_Server.getPlayerByName(name);
        if (player) {
            player.sendMessage("You have been de-opped!");
        }
        sender.sendMessage("Player " + name + " has been de-opped.");
    };
}