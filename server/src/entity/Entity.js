import {Entity} from "../../../client/common/entity/Entity.js";
import {EntityMovementPacket} from "../packet/EntityMovementPacket.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {Int32Tag} from "../../../client/common/compound/int/Int32Tag.js";
import {randomUUID} from "crypto";
import {UInt8Tag} from "../../../client/common/compound/int/UInt8Tag.js";
import {EntityVelocityPacket} from "../packet/EntityVelocityPacket.js";

let _entityId = 0;

export class S_Entity extends Entity {
    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        uuid: new StringTag(""),
        type: new UInt8Tag(0),
        x: new Float32Tag(0),
        y: new Float32Tag(0),
        vx: new Float32Tag(0),
        vy: new Float32Tag(0)
    });
    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        id: new Int32Tag(0),
        type: new UInt8Tag(0),
        x: new Float32Tag(0),
        y: new Float32Tag(0),
        vx: new Float32Tag(0),
        vy: new Float32Tag(0)
    });
    static NBT_IGNORE = ["type"];

    currentViewers = new Set;

    /**
     * @param {S_World} world
     * @param {ObjectTag} nbt
     */
    constructor(world, nbt = new ObjectTag) {
        super(++_entityId, 0, world, null);
        this.type = this.constructor.TYPE;
        this.baseBB = this.constructor.BOUNDING_BOX;
        this.bb = this.constructor.BOUNDING_BOX.clone();
        this.downBB = this.constructor.BOUNDING_BOX.clone();

        const nbtValue = nbt.value;
        this.nbt = this.constructor.NBT_PRIVATE_STRUCTURE.clone().apply(nbtValue);
        this.publicNBT = this.constructor.NBT_PUBLIC_STRUCTURE.clone().apply(nbtValue);
        this.nbt.applyTo(this, this.constructor.NBT_IGNORE);
        this.uuid ||= randomUUID();
    };

    findClosestPlayer(modes = [0, 1, 2]) {
        let closest = null;
        for (const player of this.currentViewers) {
            if (!modes.includes(player.getGamemode())) continue;
            const dist = player.distance(this.x, this.y);
            if (!closest || dist < closest[0]) closest = [dist, player];
        }
        return closest ? closest[1] : null;
    };

    broadcastPacketToViewers(pk) {
        for (const viewer of this.currentViewers) {
            viewer.session.sendPacket(pk);
        }
    };

    broadcastPacketsToViewers(packets) {
        for (const viewer of this.currentViewers) {
            viewer.sendPackets(packets);
        }
    };

    teleport(x, y) {
        this.x = x;
        this.y = y;
        this.handleMovement();
        this.broadcastMovement();
        this.broadcastEntity();
    };

    applyVelocity(vx, vy) {
        super.applyVelocity(vx, vy);
        this.broadcastVelocity();
    };

    /*** @return {S_Entity[]} */
    getViewers() {
        return this.world.getChunkViewers(this.x >> 4);
    };

    /*** @return {S_Player[]} */
    getPlayerViewers() {
        return this.world.getChunkPlayerViewers(this.x >> 4);
    };

    isInvisible() {
        return false;
    };

    broadcastEntity() {
        if (this.isInvisible()) return;
        for (const viewer of this.getPlayerViewers()) {
            if (viewer === this) continue;
            viewer.session.showEntity(this);
        }
    };

    broadcastMovement() {
        if (this.isInvisible()) return;
        this.broadcastPacketToViewers(EntityMovementPacket(this.id, this.x, this.y));
    };

    broadcastVelocity() {
        if (this.isInvisible()) return;
        this.broadcastPacketToViewers(EntityVelocityPacket(this.id, this.vx, this.vy));
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

    saveNBT() {
        this.nbt.apply(this);
    };

    savePublicNBT() {
        this.publicNBT.apply(this);
    };
}