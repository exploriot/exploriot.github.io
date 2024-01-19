import {Command} from "../Command.js";
import {S_Player} from "../../entity/Player.js";
import {S_Server} from "../../Server.js";

export class TeleportCommand extends Command {
    constructor() {
        super("teleport", "Teleports players.", "/teleport <player> | <player> <player> | <x> <y> | <player> <x> <y>", ["tp"]);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        let player, x, y;
        switch (args.length) {
            case 0:
                return Command.ERR_USAGE;
            case 1:
                if (!(sender instanceof S_Player)) return Command.ERR_USAGE;
                player = S_Server.getPlayerByPrefix(args[0]);
                if (!player) return sender.sendMessage("Player not found.");
                sender.teleport(player.x, player.y);
                sender.sendMessage(`You have been teleported to ${player.username}.`);
                break;
            case 2:
                x = parseFloat(args[0]);
                if (sender instanceof S_Player && !isNaN(x) && isFinite(x)) {
                    y = parseFloat(args[1]);
                    if (isNaN(y) || !isFinite(y)) return Command.ERR_USAGE;
                    sender.teleport(x, y);
                    sender.sendMessage(`You have been teleported to (${x}, ${y}).`);
                    break;
                }
                const p1 = S_Server.getPlayerByPrefix(args[0]);
                const p2 = S_Server.getPlayerByPrefix(args[1]);
                if (!p1 || !p2) return sender.sendMessage("Player not found.");
                p1.teleport(p2.x, p2.y);
                sender.sendMessage(`${p1.username} has been teleported to ${p2.username}.`);
                break;
            case 3:
                player = S_Server.getPlayerByPrefix(args[0]);
                if (!player) return sender.sendMessage("Player not found.");
                x = parseFloat(args[1]);
                y = parseFloat(args[2]);
                if (
                    isNaN(x) || !isFinite(x) ||
                    isNaN(y) || !isFinite(y)
                ) return Command.ERR_USAGE;
                player.teleport(x, y);
                sender.sendMessage(`${player.username} has been teleported to (${x}, ${y}).`);
                break;
            default:
                return Command.ERR_USAGE;
        }
    };
}