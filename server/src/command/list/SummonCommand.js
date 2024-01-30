import {AdvancedCommand} from "../AdvancedCommand.js";
import {EntityIds} from "../../../../client/common/metadata/Entities.js";
import {S_TNTEntity} from "../../entity/TNTEntity.js";
import {randomUUID} from "crypto";
import {S_XPOrbEntity} from "../../entity/XPOrbEntity.js";
import {S_ItemEntity} from "../../entity/ItemEntity.js";
import {Item} from "../../../../client/common/item/Item.js";
import {Ids} from "../../../../client/common/metadata/Ids.js";
import {S_FallingBlockEntity} from "../../entity/FallingBlockEntity.js";

function applyNBT(entity, nbt, allow) {
    if (!nbt) return entity;
    for (const k of allow) {
        if (k in nbt && typeof entity[k] === typeof nbt[k] && nbt[k] !== null) entity[k] = nbt[k];
    }
    return entity;
}

const EntitySummoner = {
    [EntityIds.TNT](world, x, y, nbt) {
        const entity = new S_TNTEntity(randomUUID(), world);
        entity.x = x;
        entity.y = y;
        applyNBT(entity, nbt, ["fuse", "damageRadius", "explodeRadius", "maxDamage", "parentEntityUUID"]);
        world.addEntity(entity);
    },
    [EntityIds.XP_ORB](world, x, y, nbt) {
        const entity = new S_XPOrbEntity(randomUUID(), world);
        entity.x = x;
        entity.y = y;
        applyNBT(entity, nbt, ["size", "despawnTimer", "combineTimer"]);
        world.addEntity(entity);
    },
    [EntityIds.ITEM](world, x, y, nbt) {
        if (typeof nbt.item !== "object" || !nbt.item || nbt.item.id <= Ids.AIR || nbt.item.id >= Ids.__LEN) return;
        const itemData = applyNBT({
            meta: 0,
            count: 1,
            nbt: {}
        }, nbt.item, ["meta", "count", "nbt"]);
        const entity = new S_ItemEntity(randomUUID(), world, new Item(
            nbt.item.id, itemData.meta, itemData.count, itemData.nbt
        ));
        entity.x = x;
        entity.y = y;
        applyNBT(entity, nbt, ["despawnTimer", "combineTimer", "holdTimer"]);
        world.addEntity(entity);
    },
    [EntityIds.FALLING_BLOCK](world, x, y, nbt) {
        if (typeof nbt.block !== "object" || !nbt.block || nbt.block.id <= Ids.AIR || nbt.block.id > Ids.__MAX_BLOCK) return;
        const blockData = applyNBT({
            meta: 0
        }, nbt.block, ["meta"]);
        const entity = new S_FallingBlockEntity(randomUUID(), world, nbt.block.id, blockData.meta);
        entity.x = x;
        entity.y = y;
        applyNBT(entity, nbt, ["fallY"]);
        world.addEntity(entity);
    }
};

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
            const summoner = EntitySummoner[entity.id];
            if (!summoner) return sender.sendMessage("§c" + entity.name + " can't be summoned.");
            summoner(world, position.x, position.y, nbt);
            sender.sendMessage(`Summoned a ${entity.name} at (${position.x}, ${position.y}) in the world ${world.name}.`);
        },
        "@p <entity: entity_type> <position: position> <nbt?: json>"(player, [entity, position, nbt]) {
            const summoner = EntitySummoner[entity.id];
            if (!summoner) return player.sendMessage("§c" + entity.name + " can't be summoned.");
            summoner(player.world, position.x, position.y, nbt);
            player.sendMessage(`Summoned a ${entity.name} at (${position.x}, ${position.y}).`);
        },
        "@p <entity: entity_type> <nbt?: json>"(player, [entity, nbt]) {
            const summoner = EntitySummoner[entity.id];
            if (!summoner) return player.sendMessage("§c" + entity.name + " can't be summoned.");
            summoner(player.world, player.x, player.y, nbt);
            player.sendMessage(`Summoned a ${entity.name}.`);
        }
    };
}