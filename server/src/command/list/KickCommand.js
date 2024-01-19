import {Command} from "../Command.js";
import {S_Server} from "../../Server.js";

export class KickCommand extends Command {
    constructor() {
        super("kick", "Kicks a player.", "/kick <player>", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        if (args.length !== 1) return Command.ERR_USAGE;
        const player = S_Server.getPlayerByPrefix(args[0]);
        if (!player) return sender.sendMessage("Player not found.");
        player.kick("Kicked by operator.");
        sender.sendMessage(`Player ${player.username} was kicked.`);
    };
}