import {Tile, TileIds} from "./Tile.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Int8Tag} from "../../../client/common/compound/int/Int8Tag.js";
import {randInt} from "../../../client/common/Utils.js";
import {ENTITY_MAP} from "../world/World.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import {getEntityByName} from "../../../client/common/metadata/Entities.js";

/**
 * @property {number} entityType
 * @property {string} entityNBT
 */
export class SpawnerTile extends Tile {
    static TYPE = TileIds.CHEST;
    static NBT_STRUCTURE = new ObjectTag({
        entityName: new StringTag(""),
        entityType: new Int8Tag(0),
        entityNBT: new StringTag("{}")
    }).combine(Tile.NBT_STRUCTURE);

    init() {
        if (this.entityName) {
            this.entityType ||= getEntityByName(this.entityName);
            this.nbt.removeTag("entityName");
            delete this.entityName;
        }
        return this.validate();
    };

    validate() {
        if (!ENTITY_MAP[this.entityType]) {
            this.remove();
            return false;
        }
        return true;
    };

    updatePeriod = 10; // 10-40 seconds
    updateTry = 0;

    canSpawnEntities() {
        const cx = this.x << 4;
        let count = 0;
        for (let x = cx - 1; x <= cx + 1; x++) {
            for (const entity of this.world.getChunkEntities(cx)) {
                if (entity.type === this.entityType && entity.distance(this.x, this.y) < 13 && (++count) >= 6) return false;
            }
        }
        return true;
    };

    update(dt) {
        if (!this.validate()) return;
        if ((++this.updateTry) >= 4 || Math.random() < 0.5) {
            this.updateTry = 0;
            if (this.canSpawnEntities()) {
                const entity = this.world.summonEntity(this.entityType, this.x + randInt(-4, 4), this.y + randInt(-4, 1), JSON.parse(this.entityNBT));
                if (entity && entity.world.getCollidingBlock(entity.bb)) entity.remove();
            }
        } else this.updateTry++;
        return super.update(dt);
    };
}