import {Entity} from "../../../client/common/entity/Entity.js";
import {EntityMovementPacket} from "../packet/EntityMovementPacket.js";

let _entityId = 0;

export class S_Entity extends Entity {
    currentViewers = new Set;

    /**
     * @param {number} type
     * @param {S_World} world
     * @param {BoundingBox} bb
     */
    constructor(type, world, bb) {
        super(++_entityId, type, world, bb);
    }

    /*** @return {S_Player[]} */
    getViewers() {
        return this.world.getChunkViewers(this.x >> 4);
    };

    broadcastEntity() {
        for (const viewer of this.getViewers()) {
            if (viewer === this) continue;
            viewer.session.showEntity(this);
        }
    };

    broadcastMovement() {
        const pk = EntityMovementPacket(this.id, this.x, this.y);
        for (const viewer of this.currentViewers) {
            viewer.session.sendPacket(pk);
        }
    };

    broadcastDespawn() {
        for (const viewer of this.currentViewers) {
            viewer.session.hideEntity(this);
        }
    };

    remove() {
        super.remove();
        this.broadcastDespawn();
    };

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y
        };
    };
}