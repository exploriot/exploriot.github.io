import {AdvancedCommand} from "../AdvancedCommand.js";

export class ListCommand extends AdvancedCommand {
    constructor() {
        super(
            "list",
            "Shows a list of players.",
            []
        );
    };

    executor = {
        ""(sender) {
            const players = Server.getPlayers();
            sender.sendMessage(`Player${players.size > 1 ? "s" : ""}(${players.size}): ${Array.from(players).map(i => i.username).join(", ")}`);
        }
    };
}