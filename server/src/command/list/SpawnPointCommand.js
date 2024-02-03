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
        "<players> <world> <position>"(sender, [players, world, position]) {
            for (const p of players) p.setSpawnPoint(position.x, position.y, world);
            sender.sendMessage(`${players.map(i => i.username).join(" and ")}'s spawn location was set to (${position.x}, ${position.y}).`);
        },
        "@p <players> <position>"(player, [players, position]) {
            for (const p of players) player.setSpawnPoint(position.x, position.y, player.world);
            player.sendMessage(`${players.map(i => i.username).join(" and ")}'s spawn location was set to (${position.x}, ${position.y}).`);
        },
        "@p <players>"(player, [players]) {
            for (const p of players) player.setSpawnPoint(player.x, player.y, player.world);
            player.sendMessage(`${players.map(i => i.username).join(" and ")}'s spawn location was set to (${player.x}, ${player.y}).`);
        },
        "@p <position>"(player, [position]) {
            player.setSpawnPoint(position.x, position.y, player.world);
            player.sendMessage(`Your spawn location was set to (${position.x}, ${position.y}).`);
        },
        "@p"(player) {
            player.setSpawnPoint(player.x, player.y, player.world);
            player.sendMessage(`Your spawn location was set to (${player.x}, ${player.y}).`);
        }
    };
}