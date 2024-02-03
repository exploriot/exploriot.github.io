import {AdvancedCommand} from "../AdvancedCommand.js";

export class OpCommand extends AdvancedCommand {
    constructor() {
        super(
            "op",
            "Ops players.",
            [],
            true
        );
    };

    executor = {
        "<players>"(sender, [players]) {
            for (const player of players) {
                if (Server.isOp(player)) return sender.sendMessage("Player " + player.username + " is already not an operator.");
                player.sendMessage("§7You have been opped.");
                Server.addOp(player);
            }
            sender.sendMessage("Player" + (players.length > 1 ? "s" : "") + " " + players.map(i => i.username).join(" and ") + " has been opped.");
        },
        "<player: string>"(sender, [name]) {
            if (Server.isOp(name)) return sender.sendMessage("Player " + name + " is already not an operator.");
            Server.addOp(name);
            sender.sendMessage("Player " + name + " has been opped.");
        }
    };
}