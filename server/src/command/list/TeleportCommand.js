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
        "<world> <entities;0> <entity>"(sender, [_, entities, target]) {
            for (const entity of entities) entity.teleport(target.x, target.y);
            sender.sendMessage(`${entities.map(i => i.getName()).join(" and ")} has been teleported to ${target.getName()}.`);
        },
        "<world> <entities;0> <position>"(sender, [_, entities, position]) {
            for (const entity of entities) entity.teleport(position.x, position.y);
            sender.sendMessage(`${entities.map(i => i.getName()).join(" and ")} has been teleported to (${position.x}, ${position.y}).`);
        },
        "@e <entity>"(player, [target]) {
            player.teleport(target.x, target.y);
            player.sendMessage(`You have been teleported to ${target.getName()}.`);
        },
        "@e <position>"(player, [position]) {
            player.teleport(position.x, position.y);
            player.sendMessage(`You have been teleported to (${position.x}, ${position.y}).`);
        },
        "@e <entities> <entity>"(sender, [entities, target]) {
            this["<world> <entities;0> <entity>"](sender, [entities, target]);
        },
        "@e <entities> <position>"(sender, [entities, position]) {
            for (const entity of entities) entity.teleport(position.x, position.y);
            sender.sendMessage(`${entities.map(i => i.getName()).join(" and ")} has been teleported to (${position.x}, ${position.y}).`);
        }
    };
}