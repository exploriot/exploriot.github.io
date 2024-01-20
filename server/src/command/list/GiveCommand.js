import {Item} from "../../../../client/common/item/Item.js";
import {getItemName} from "../../../../client/common/metadata/Items.js";
import {AdvancedCommand} from "../AdvancedCommand.js";

export class GiveCommand extends AdvancedCommand {
    constructor() {
        super(
            "give",
            "Gives items to players.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p> <item: item> <count?: uint> <nbt?: json>": (sender, [players, baseItem, _count, _nbt]) => {
            const count = _count ?? 1;
            const nbt = _nbt ?? {};

            const item = new Item(baseItem.id, baseItem.meta, count, nbt);
            for (const player of players) player.playerInventory.add(item);
            sender.sendMessage(
                "Added " + (count - item.count) + " " + getItemName(baseItem.id, baseItem.meta)
                + " to " + players.map(i => i.username).join(" and ") + "." + (item.count > 0 ? "(Couldn't give " + item.count + " of it)" : "")
            );
        }
    };
}