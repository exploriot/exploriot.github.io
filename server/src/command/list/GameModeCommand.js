import {AdvancedCommand} from "../AdvancedCommand.js";

export class GameModeCommand extends AdvancedCommand {
    constructor() {
        super(
            "gamemode",
            "Changes player's gamemode.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p> <mode: gamemode>"(sender, [players, mode]) {
            for (const player of players) player.setGamemode(mode.id);
            sender.sendMessage(`${players.map(i => i.username).join(" and ")}'s gamemode has been set to ${mode.name}.`);
        },
        "@p <mode: gamemode>"(player, [mode]) {
            player.setGamemode(mode.id);
            player.sendMessage(`Your gamemode has been set to ${mode.name}.`);
        }
    };
}