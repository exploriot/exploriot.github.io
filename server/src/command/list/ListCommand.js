import {Command} from "../Command.js";

export class ListCommand extends Command {
    constructor() {
        super(
            "list",
            "Shows a list of players.",
            []
        );
    };

    execute(sender, args) {
        const players = Server.getPlayers();
        sender.sendMessage(`Player${players.length > 1 ? "s" : ""}(${players.size}): ${Array.from(players).join(", ")}`);
    };
}