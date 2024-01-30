import {AdvancedCommand} from "../AdvancedCommand.js";

export class GameRuleCommand extends AdvancedCommand {
    constructor() {
        super(
            "gamerule",
            "Changes a rule in a world.",
            [],
            true
        );
    };

    executor = {
        "<world: world> <rule: gamerule> <value: boolean>"(sender, [world, rule, value]) {
            world.setGameRule(rule.id, value);
            sender.sendMessage(`The game rule ${rule.name} was set to ${value} in the world ${world.name}.`);
        },
        "@p <rule: gamerule> <value: boolean>"(player, [rule, value]) {
            player.world.setGameRule(rule.id, value);
            player.sendMessage(`The game rule ${rule.name} was set to ${value}.`);
        }
    };
}