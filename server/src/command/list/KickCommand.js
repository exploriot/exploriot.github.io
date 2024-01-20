import {AdvancedCommand} from "../AdvancedCommand.js";

export class KickCommand extends AdvancedCommand {
    constructor() {
        super(
            "kick",
            "Kicks a player.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p>": (sender, [players]) => {
            for (const player of players) player.kick("Kicked by operator.");
            sender.sendMessage(`Player${players.length > 1 ? "s" : ""} ${players.map(i => i.username).join(" and ")} was kicked.`);
        }
    };
}