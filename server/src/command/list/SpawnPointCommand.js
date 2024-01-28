import {AdvancedCommand} from "../AdvancedCommand.js";

export class SpawnPointCommand extends AdvancedCommand {
    constructor() {
        super(
            "spawnpoint",
            "Sets the spawn location of a player with respect to a world.",
            [],
            true
        );
    };

    executor = {
        "<player: selector_p> <world: world> <position: position>": (sender, [players, world, position]) => {
            for (const p of players) world.setPlayerSpawnLocation(p.name, position.x, position.y);
            sender.sendMessage(`${players.map(i => i.username).join(" and ")}'s spawn location was set to (${position.x}, ${position.y}).`);
        },
        "@p <player: selector_p> <position: position>": (player, [players, position]) => {
            for (const p of players) player.world.setPlayerSpawnLocation(p.name, position.x, position.y);
            player.sendMessage(`${players.map(i => i.username).join(" and ")}'s spawn location was set to (${position.x}, ${position.y}).`);
        },
        "@p <player: selector_p>": (player, [players]) => {
            for (const p of players) player.world.setPlayerSpawnLocation(p.name, player.x, player.y);
            player.sendMessage(`${players.map(i => i.username).join(" and ")}'s spawn location was set to (${player.x}, ${player.y}).`);
        },
        "@p <position: position>": (player, [position]) => {
            player.world.setPlayerSpawnLocation(player.name, position.x, position.y);
            player.sendMessage(`Your spawn location was set to (${position.x}, ${position.y}).`);
        },
        "@p": player => {
            player.world.setPlayerSpawnLocation(player.name, player.x, player.y);
            player.sendMessage(`Your spawn location was set to (${player.x}, ${player.y}).`);
        }
    };
}