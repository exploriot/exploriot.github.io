import {Command} from "../Command.js";
import {Item} from "../../../../client/common/item/Item.js";
import {Ids} from "../../../../client/common/metadata/Ids.js";
import {getItemIdByName, getItemName} from "../../../../client/common/metadata/Items.js";
import {S_Server} from "../../Server.js";

export class GiveCommand extends Command {
    constructor() {
        super("give", "Gives items to players.", "/give <player> <item> <?count> <?nbt>", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        if (args.length > 5 || args.length < 2) return Command.ERR_USAGE;
        const player = S_Server.getPlayerByPrefix(args[0])
        if (!player) return sender.sendMessage("Player not found.");
        const spl = args[1].split(":");
        const id = isNaN(parseInt(spl[0])) ? getItemIdByName(spl[0]) : parseInt(spl[0]);
        const meta = spl[1] ? parseInt(spl[1]) : 0;
        const count = parseInt(args[2] || "1");
        if (!Object.values(Ids).includes(id) || meta < 0 || meta > 15 || count < 0) return Command.ERR_USAGE;
        let nbt;
        try {
            nbt = JSON.parse(args[3] || "{}");
        } catch (e) {
            return player.sendMessage("NBTError: " + e.message);
        }
        const item = new Item(id, meta, count, nbt);
        player.playerInventory.add(item);
        sender.sendMessage("Added " + (count - item.count) + " " + getItemName(id, meta) + " to " + player.username + "." + (item.count > 0 ? "(Couldn't give " + item.count + " of it)" : ""));
    };
}