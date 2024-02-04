import {AdvancedCommand} from "../AdvancedCommand.js";
import {ObjectTag} from "../../../../client/common/compound/ObjectTag.js";

function inspectNBT(sender, type, any, path, value) {
    if (!any) return sender.sendMessage("No data was found for the " + type + ".");
    any.saveNBT();
    if (value === undefined) {
        let nbt = any.nbt.serialize();
        if (path) for (const p of path.split(".")) {
            nbt = nbt[p];
            if (nbt === undefined) break;
        }
        if (nbt === undefined) return sender.sendMessage("The given NBT path does not exist on this " + type + ".");
        sender.sendMessage(path + ": " + JSON.stringify(nbt));
    } else {
        let nbt = any.nbt;
        const spl = path.split(".");
        for (let i = 0; i < spl.length; i++) {
            if (!(nbt instanceof ObjectTag) || !(spl[i] in nbt.tags)) {
                return sender.sendMessage("The given NBT path does not exist on this " + type + ".");
            }
            nbt = nbt.tags[spl[i]];
        }
        if (nbt.apply(value)) {
            nbt.applyTo(any, any.constructor.NBT_IGNORE ?? []);
            sender.sendMessage("NBT writing successful.");
        } else sender.sendMessage("NBT writing unsuccessful.");
    }
}

export class DataCommand extends AdvancedCommand {
    constructor() {
        super(
            "data",
            "Inspects NBT data of entities/blocks.",
            [],
            true
        );
    };

    executor = {
        "(block) <world> <position> <path?: string> <value?: json,float,spread_text>"(sender, [world, position, path, value]) {
            /*** @type {Tile} */
            const tile = world.getTile(position.x, position.y);
            inspectNBT(sender, "block", tile, path, value);
        },
        "@e (block) <position> <path?: string> <value?: json,float,spread_text>"(sender, [position, path, value]) {
            this["(block) <world> <position> <path?: string> <value?: json,float,spread_text>"](sender, [sender.world, position, path, value]);
        },
        "(entity) <world> <entity;0> <path?: string> <value?: json,float,spread_text>"(sender, [_, entity, path, value]) {
            inspectNBT(sender, "entity", entity, path, value);
        },
        "@e (entity) <entity> <path?: string> <value?: json,float,spread_text>"(sender, [entity, path, value]) {
            this["(entity) <world> <entity;0> <path?: string> <value?: json,float,spread_text>"](sender, [sender.world, entity, path, value]);
        }
    };
}