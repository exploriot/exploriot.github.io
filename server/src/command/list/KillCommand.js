import {AdvancedCommand} from "../AdvancedCommand.js";
import {CommandSender} from "../CommandSender.js";

export class KillCommand extends AdvancedCommand {
    constructor() {
        super(
            "kill",
            "Kills entities.",
            [],
            true
        );
    };

    executor = {
        "<world> <entities;0>"(sender, [_, entities]) {
            for (const entity of entities) entity.kill();
            sender.sendMessage(`${entities.map(i => i.username ?? i.constructor.name).join(" and ")} was killed.`);
        },
        "@e <entities>"(sender, [entities]) {
            for (const entity of entities) entity.kill();
            sender.sendMessage(`${entities.map(i => i.username ?? i.constructor.name).join(" and ")} was killed.`);
        },
        "@e"(entity) {
            entity.kill();
            if (entity instanceof CommandSender) {
                entity.sendMessage(`${entity.username ?? entity.constructor.name} was killed.`);
            }
        }
    };
}