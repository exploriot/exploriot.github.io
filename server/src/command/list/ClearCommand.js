import {AdvancedCommand} from "../AdvancedCommand.js";

export class ClearCommand extends AdvancedCommand {
    constructor() {
        super(
            "clear",
            "Clears inventory of a player.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p>"(sender, [players]) {
            for (const player of players) {
                player.clearAllInventories();
                sender.sendMessage(`Player ${player.username}'s inventory has been cleared.`);
            }
        },
        "@p"(player) {
            player.clearAllInventories();
            player.sendMessage("Your inventory has been cleared.");
        }
    };
}