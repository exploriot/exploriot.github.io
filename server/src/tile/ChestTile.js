import {TileIds} from "./Tile.js";
import {ContainerTile} from "./ContainerTile.js";
import {ContainerIds} from "../../../client/common/item/Inventory.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {BoolTag} from "../../../client/common/compound/BoolTag.js";

/**
 * @property {boolean} isDouble
 */
export class ChestTile extends ContainerTile {
    static TYPE = TileIds.CHEST;
    static NBT_STRUCTURE = new ObjectTag({
        isDouble: new BoolTag(false)
    }).combine(ContainerTile.NBT_STRUCTURE);

    init() {
        this.size = this.isDouble ? 54 : 27;
        this.containerId = this.isDouble ? ContainerIds.DOUBLE_CHEST : ContainerIds.CHEST;
        return super.init();
    };
}