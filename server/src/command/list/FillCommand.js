import {getItemName} from "../../../../client/common/metadata/Items.js";
import {AdvancedCommand} from "../AdvancedCommand.js";

const MAX_FILL = 2 ** 14;

function doFill(world, from, to, id, meta) {
    const x1 = Math.min(from.x, to.x);
    const x2 = Math.max(from.x, to.x);
    const y1 = Math.min(from.y, to.y);
    const y2 = Math.max(from.y, to.y);

    const amount = (x2 - x1 + 1) * (y2 - y1 + 1);
    if (amount > MAX_FILL) return false;

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
            world.setBlock(x, y, id, meta);
        }
    }
    return true;
}

export class FillCommand extends AdvancedCommand {
    constructor() {
        super(
            "fill",
            "Fills a group of blocks in the world.",
            [],
            true
        );
    };

    executor = {
        "@p <from: position> <to: position> <block: block>": (sender, [from, to, block]) => {
            const r = doFill(sender.world, from, to, block.id, block.meta);
            if (!r) return sender.sendMessage("§cCannot fill more than " + MAX_FILL + " blocks!");
            sender.sendMessage(`The blocks from (${from.x}, ${from.y}) to (${to.x}, ${to.y}) was replaced with ${getItemName(block.id, block.meta)}.`);
        },
        "<world: world> <from: position> <to: position> <block: block>": (sender, [world, from, to, block]) => {
            const r = doFill(world, from, to, block.id, block.meta);
            if (!r) return sender.sendMessage("§cCannot fill more than " + MAX_FILL + " blocks!");
            sender.sendMessage(`The blocks from (${from.x}, ${from.y}) to (${to.x}, ${to.y}) in the world ${world.name} was replaced with ${getItemName(block.id, block.meta)}.`);
        }
    };
}