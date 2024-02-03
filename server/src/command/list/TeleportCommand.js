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
        "@p <entity>"(player, [target]) {
            player.teleport(target.x, target.y);
            player.sendMessage(`You have been teleported to ${target.getName()}.`);
        },
        "<entities> <entity>"(sender, [entities, target]) {
            for (const entity of entities) entity.teleport(target.x, target.y);
            sender.sendMessage(`${entities.map(i => i.getName()).join(" and ")} has been teleported to ${targets[0].getName()}.`);
        },
        "@p <position>"(player, [position]) {
            player.teleport(position.x, position.y);
            player.sendMessage(`You have been teleported to (${position.x}, ${position.y}).`);
        },
        "<entities> <position>"(sender, [entities, position]) {
            for (const entity of entities) entity.teleport(position.x, position.y);
            sender.sendMessage(`${entities.map(i => i.getName()).join(" and ")} has been teleported to (${position.x}, ${position.y}).`);
        }
    };
}