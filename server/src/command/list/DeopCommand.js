import {AdvancedCommand} from "../AdvancedCommand.js";

export class DeopCommand extends AdvancedCommand {
    constructor() {
        super(
            "deop",
            "De-ops players.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p>"(sender, [players]) {
            for (const player of players) {
                if (!Server.isOp(player)) return sender.sendMessage("Player " + player.username + " is already not an operator.");
                Server.removeOp(player);
            }
            sender.sendMessage("Player" + (players.length > 1 ? "s" : "") + " " + players.map(i => i.username).join(" and ") + " has been de-opped.");
        },
        "<player: string>"(sender, [name]) {
            if (!Server.isOp(name)) return sender.sendMessage("Player " + name + " is already not an operator.");
            Server.removeOp(name);
            sender.sendMessage("Player " + name + " has been de-opped.");
        }
    };
}