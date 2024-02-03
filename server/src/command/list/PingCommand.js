import {AdvancedCommand} from "../AdvancedCommand.js";

export class PingCommand extends AdvancedCommand {
    constructor() {
        super(
            "ping",
            "Checks the ping of the user.",
            [],
            true
        );
    };

    executor = {
        "<players>"(sender, [players]) {
            for (const player of players) {
                sender.sendMessage(`Player ${player.username}'s ping is ${player.session.ping}.`);
            }
        },
        "@p"(player) {
            player.sendMessage(`Your ping is ${player.session.ping}ms.`);
        }
    };
}