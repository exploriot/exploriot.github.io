import {AdvancedCommand} from "../AdvancedCommand.js";

export class TeleportCommand extends AdvancedCommand {
    constructor() {
        super(
            "teleport",
            "Teleports players.",
            ["tp"],
            true
        );
    };

    executor = {
        "@p <player: selector>"(player, [targets]) {
            if (targets.length === 0) return player.sendMessage("Expected exactly one target for teleportation.");
            player.teleport(targets[0].x, targets[0].y);
            player.sendMessage(`You have been teleported to ${targets[0].getName()}.`);
        },
        "<player: selector> <player: selector>"(sender, [players, targets]) {
            if (players.length === 0) return sender.sendMessage("The given selector couldn't be found.");
            if (targets.length !== 1) return sender.sendMessage("Expected exactly one target for teleportation.");
            for (const player of players) player.teleport(targets[0].x, targets[0].y);
            sender.sendMessage(`${players.map(i => i.username).join(" and ")} has been teleported to ${targets[0].getName()}.`);
        },
        "@p <position: position>"(player, [position]) {
            player.teleport(position.x, position.y);
            player.sendMessage(`You have been teleported to (${position.x}, ${position.y}).`);
        },
        "<player: selector> <position: position>"(sender, [players, position]) {
            if (players.length !== 1) return sender.sendMessage("The given selector couldn't be found.");
            for (const player of players) player.teleport(position.x, position.y);
            sender.sendMessage(`${players.map(i => i.username).join(" and ")} has been teleported to (${position.x}, ${position.y}).`);
        }
    };
}