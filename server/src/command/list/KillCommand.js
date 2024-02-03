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
        "<entities>"(sender, [entities]) {
            for (const entity of entities) entity.remove(true);
            sender.sendMessage(`${entities.map(i => i.username ?? i.constructor.name).join(" and ")} was killed.`);
        },
        "@e"(entity) {
            entity.remove(true);
            if (entity instanceof CommandSender) {
                entity.sendMessage(`${entity.username ?? entity.constructor.name} was killed.`);
            }
        }
    };
}