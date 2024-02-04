import {TileIds} from "./Tile.js";
import {ContainerTile} from "./ContainerTile.js";
import {ContainerIds} from "../../../client/common/item/Inventory.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";
import {Ids} from "../../../client/common/metadata/Ids.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";

/**
 * @property {number} fuel
 * @property {number} maxFuel
 * @property {number} smeltProgress
 * @property {number} holdingXP
 */
export class FurnaceTile extends ContainerTile {
    static TYPE = TileIds.FURNACE;
    static NBT_STRUCTURE = new ObjectTag({
        fuel: new Float32Tag(0),
        maxFuel: new Float32Tag(0),
        smeltProgress: new Float32Tag(0),
        holdingXP: new Float32Tag(0)
    }).combine(ContainerTile.NBT_STRUCTURE);

    size = 3;
    containerId = ContainerIds.FURNACE;
    updatePeriod = 0.1;

    canSmeltItem() {
        const item = this.container.get(0);
        if (!item) return false;
        const result = Metadata.smeltsTo[item.id]?.evaluate();
        if (!result) return false;
        const currentResult = this.container.get(2);
        return !currentResult || (result.equals(currentResult, false, true) && currentResult.count < currentResult.maxStack);
    };

    smeltItem() {
        const item = this.container.get(0);
        this.container.decreaseItemAt(0);
        const result = Metadata.smeltsTo[item.id]?.evaluate();
        this.holdingXP += Metadata.smeltXP[item.id] ?? 0;
        const currentResult = this.container.get(2);
        if (!currentResult) {
            this.container.set(2, result);
        } else if (result.equals(currentResult, false, true)) {
            currentResult.count++;
            this.container.updateIndex(2);
        }
    };

    getClientState() {
        return {
            fuel: this.fuel,
            maxFuel: this.maxFuel,
            smeltProgress: this.smeltProgress,
            smeltProgressMax: 10
        };
    };

    update() {
        const dt = this.updatePeriod;
        if (this.fuel > 0) {
            this.fuel -= dt;
            if (this.fuel <= 0) {
                this.fuel = 0;
                this.maxFuel = 0;
                this.world.setBlock(this.x, this.y, Ids.FURNACE, 0, {updateSelf: false});
                this.broadcastState();
            } else {
                if (this.canSmeltItem()) {
                    if (this.smeltProgress === 0) {
                        this.smeltProgress = 0.01;
                        this.broadcastState();
                    }
                    if ((this.smeltProgress += dt) >= 10) {
                        this.smeltProgress = 0;
                        this.smeltItem();
                        this.broadcastState();
                    }
                } else {
                    // if ((this.smeltProgress -= dt) < 0) this.smeltProgress = 0;
                    this.smeltProgress = 0;
                    this.broadcastState();
                }
            }
        } else {
            const fuelItem = this.container.get(1);
            if (fuelItem && this.canSmeltItem()) {
                this.container.decreaseItemAt(1);
                this.fuel = this.maxFuel = (Metadata.fuel[fuelItem.id] ?? 0) * 10;
                this.world.setBlock(this.x, this.y, Ids.FURNACE, 1, {updateSelf: false});
                this.broadcastState();
            }
        }
        super.update(dt);
    };

    remove() {
        this.world.dropXP(this.x, this.y, this.holdingXP);
        this.holdingXP = 0;
        super.remove();
    };
}