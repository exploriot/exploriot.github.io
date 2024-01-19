import {Command} from "../Command.js";
import {S_Player} from "../../entity/Player.js";
import {S_Server} from "../../Server.js";

export class GamemodeCommand extends Command {
    constructor() {
        super("gamemode", "Changes player's gamemode.", "/gamemode <mode> | <player> <mode>", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        let mode;
        switch (args.length) {
            case 0:
                return Command.ERR_USAGE;
            case 1:
                if (!(sender instanceof S_Player)) return Command.ERR_USAGE;
                mode = parseInt(args[0]);
                if (isNaN(mode) || !isFinite(mode) || mode < 0 || mode > 3) return Command.ERR_USAGE;
                sender.setGamemode(mode);
                sender.sendMessage(`Your gamemode has been set to ${mode}.`);
                break;
            case 2:
                const player = S_Server.getPlayerByPrefix(args[0]);
                if (!player) return sender.sendMessage("Player not found.");
                mode = parseInt(args[1]);
                if (isNaN(mode) || !isFinite(mode) || mode < 0 || mode > 3) return Command.ERR_USAGE;
                player.setGamemode(mode);
                sender.sendMessage(`Player ${player.username}'s gamemode has been set to ${mode}.`);
                break;
            default:
                return Command.ERR_USAGE;
        }
    };
}