import {getItemName} from "../../../../client/common/metadata/Items.js";
import {AdvancedCommand} from "../AdvancedCommand.js";

export class SetBlockCommand extends AdvancedCommand {
    constructor() {
        super(
            "setblock",
            "Sets a block in the world.",
            [],
            true
        );
    };

    executor = {
        "@p <position: position> <block: block>": (sender, [position, block]) => {
            sender.world.setBlock(position.x, position.y, block.id, block.meta);
            sender.sendMessage(`The block at (${position.x}, ${position.y}) was replaced with ${getItemName(block.id, block.meta)}.`);
        },
        "<world: world> <position: position> <block: block>": (sender, [world, position, block]) => {
            world.setBlock(position.x, position.y, block.id, block.meta);
            sender.sendMessage(`The block at (${position.x}, ${position.y}) in the world ${world.name} was replaced with ${getItemName(block.id, block.meta)}.`);
        }
    };
}