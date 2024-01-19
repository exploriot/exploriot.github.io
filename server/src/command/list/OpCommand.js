import {Command} from "../Command.js";
import {S_Server} from "../../Server.js";

export class OpCommand extends Command {
    constructor() {
        super("op", "Ops players.", "/op <player>", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        const name = args[0];
        if (!name) return Command.ERR_USAGE;
        if (S_Server.ops.has(name)) return sender.sendMessage("This player is already operator.");
        S_Server.ops.add(name);
        S_Server.saveOps();
        const player = S_Server.getPlayerByName(name);
        if (player) {
            player.sendMessage("You have been opped!");
        }
        sender.sendMessage("Player " + name + " has been opped.");
    };
}