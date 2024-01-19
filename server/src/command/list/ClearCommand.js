import {Command} from "../Command.js";
import {S_Player} from "../../entity/Player.js";
import {S_Server} from "../../Server.js";

export class ClearCommand extends Command {
    constructor() {
        super("clear", "Clears inventory of the player.", "/clear <?player>", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        if (
            (args.length === 0 && !(sender instanceof S_Player))
            || args.length > 1
        ) return Command.ERR_USAGE;
        const player = sender || S_Server.getPlayerByPrefix(args[0]);
        if (!player) return sender.sendMessage("Player not found.");
        player.playerInventory.clear();
        player.armorInventory.clear();
        player.cursorInventory.clear();
        player.craftInventory.clear();
        player.session.forceCloseContainer();
        player.session.sendInventory();
        sender.sendMessage(args.length === 0 ? "Your inventory has been cleared." : `Player ${player.username}'s inventory has been cleared.`);
    };
}