import {AdvancedCommand} from "../AdvancedCommand.js";

const MAX_CLONE = 2 ** 14;

function doClone(world, from1, from2, dest) {
    const x1 = Math.min(from1.x, from2.x);
    const x2 = Math.max(from1.x, from2.x);
    const y1 = Math.min(from1.y, from2.y);
    const y2 = Math.max(from1.y, from2.y);

    const amount = (x2 - x1 + 1) * (y2 - y1 + 1);
    if (amount > MAX_CLONE) return false;

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
            const block = world.getBlock(x, y);
            world.setBlock(x - x1 + dest.x, y - y1 + dest.y, block[0], block[1]);
        }
    }

    return true;
}

export class CloneCommand extends AdvancedCommand {
    constructor() {
        super(
            "clone",
            "Clones a group of blocks in the world to a position.",
            [],
            true
        );
    };

    executor = {
        "@p <from: position> <to: position> <destination: position>": (sender, [from, to, dest]) => {
            const r = doClone(sender.world, from, to, dest);
            if (!r) return sender.sendMessage("§cCannot clone more than " + MAX_CLONE + " blocks!");
            sender.sendMessage(`The blocks from (${from.x}, ${from.y}) to (${to.x}, ${to.y}) was cloned to (${dest.x}, ${dest.y}).`);
        },
        "<world: world> <from: position> <to: position> <destination: position>": (sender, [world, from, to, dest]) => {
            const r = doClone(world, from, to, dest);
            if (!r) return sender.sendMessage("§cCannot clone more than " + MAX_CLONE + " blocks!");
            sender.sendMessage(`The blocks from (${from.x}, ${from.y}) to (${to.x}, ${to.y}) in the world ${world.name} was cloned to (${dest.x}, ${dest.y}).`);
        }
    };
}