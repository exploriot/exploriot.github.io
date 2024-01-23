import {TileIds} from "./Tile.js";
import {ContainerTile} from "./ContainerTile.js";
import {ContainerIds} from "../../../client/common/item/Inventory.js";
import {Metadata} from "../../../client/common/metadata/Metadata.js";

export class FurnaceTile extends ContainerTile {
    size = 3;
    containerId = ContainerIds.FURNACE;
    updatePeriod = 0.1;
    fuel = 0;
    maxFuel = 0;
    smeltProgress = 0; // 0 to 10

    constructor(world, x, y) {
        super(TileIds.FURNACE, world, x, y);
    };

    static deserialize(world, data) {
        const tile = new FurnaceTile(world, data.x, data.y);
        tile._contents = data.contents;
        tile.fuel = data.fuel;
        tile.maxFuel = data.maxFuel;
        return tile;
    };

    serialize() {
        return {
            ...super.serialize(), fuel: this.fuel, maxFuel: this.maxFuel
        };
    };

    canSmeltItem() {
        const item = this.container.contents[0];
        if (!item) return false;
        const result = Metadata.smeltsTo[item.id]?.evaluate();
        if (!result) return false;
        const currentResult = this.container.contents[2];
        return !currentResult || (result.equals(currentResult, false, true) && currentResult.count < currentResult.maxStack);
    };

    smeltItem() {
        const item = this.container.contents[0];
        item.count--;
        if (item.count <= 0) this.container.removeIndex(0);
        else this.container.updateIndex(0);
        const result = Metadata.smeltsTo[item.id]?.evaluate();
        const currentResult = this.container.contents[2];
        if (!result) return;
        if (!currentResult) {
            this.container.setIndex(2, result);
        } else if (result.equalsItem(currentResult)) {
            currentResult.count++;
            this.container.updateIndex(2);
        }
        return !currentResult || result.equalsItem(currentResult);
    };

    getClientState() {
        return {
            fuel: this.fuel,
            maxFuel: this.maxFuel,
            smeltProgress: this.smeltProgress
        };
    };

    update(dt) {
        if (this.fuel > 0) {
            this.fuel -= dt;
            if (this.fuel <= 0) {
                this.fuel = 0;
                this.maxFuel = 0;
                this.broadcastState();
            } else {
                if (this.canSmeltItem()) {
                    if ((this.smeltProgress += dt) >= 10) {
                        this.smeltProgress = 0;
                        this.smeltItem();
                        this.broadcastState();
                    }
                } else {
                    if ((this.smeltProgress -= dt) < 0) this.smeltProgress = 0;
                }
            }
        } else {
            const fuelItem = this.container.contents[1];
            if (fuelItem && this.canSmeltItem()) {
                fuelItem.count--;
                if (fuelItem.count <= 0) this.container.removeIndex(1);
                else this.container.updateIndex(1);
                this.fuel = this.maxFuel = (Metadata.fuel[fuelItem.id] ?? 0) * 10;
                this.broadcastState();
            }
        }
        super.update(dt);
    };
}