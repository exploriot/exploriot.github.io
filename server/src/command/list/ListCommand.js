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
        sender.sendMessage(`Player${players.size > 1 ? "s" : ""}(${players.size}): ${Array.from(players).map(i => i.username).join(", ")}`);
    };
}