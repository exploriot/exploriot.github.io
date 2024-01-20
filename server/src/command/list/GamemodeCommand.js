import {AdvancedCommand} from "../AdvancedCommand.js";

export class GamemodeCommand extends AdvancedCommand {
    constructor() {
        super(
            "gamemode",
            "Changes player's gamemode.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p> <mode: gamemode>": (sender, [players, mode]) => {
            for (const player of players) player.setGamemode(mode);
            sender.sendMessage(`${players.map(i => i.username).join(" and ")}'s gamemode has been set to ${args[1]}.`);
        },
        "@p <mode: gamemode>": (player, [mode]) => {
            player.setGamemode(mode);
            player.sendMessage(`Your gamemode has been set to ${mode}.`);
        }
    };
}