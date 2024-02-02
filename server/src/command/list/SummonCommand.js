import {AdvancedCommand} from "../AdvancedCommand.js";

export class SummonCommand extends AdvancedCommand {
    constructor() {
        super(
            "summon",
            "Summons an entity to the world.",
            [],
            true
        );
    };

    executor = {
        "<entity: entity_type> <world: world> <position: position> <nbt?: json>"(sender, [entity, world, position, nbt]) {
            if (!world.summonEntity(entity.id, position.x, position.y, nbt)) {
                return sender.sendMessage("§c" + entity.name + " can't be summoned.");
            }
            sender.sendMessage(`Summoned a ${entity.name} at (${position.x}, ${position.y}) in the world ${world.name}.`);
        },
        "@p <entity: entity_type> <position: position> <nbt?: json>"(player, [entity, position, nbt]) {
            if (!player.world.summonEntity(entity.id, position.x, position.y, nbt)) {
                return player.sendMessage("§c" + entity.name + " can't be summoned.");
            }
            player.sendMessage(`Summoned a ${entity.name} at (${position.x}, ${position.y}).`);
        },
        "@p <entity: entity_type> <nbt?: json>"(player, [entity, nbt]) {
            if (!player.world.summonEntity(entity.id, player.x, player.y, nbt)) {
                return player.sendMessage("§c" + entity.name + " can't be summoned.");
            }
            player.sendMessage(`Summoned a ${entity.name}.`);
        }
    };
}