import {Entity} from "../../../client/common/entity/Entity.js";
import {EntityMovementPacket} from "../packet/EntityMovementPacket.js";
import {ObjectTag} from "../../../client/common/compound/ObjectTag.js";
import {StringTag} from "../../../client/common/compound/StringTag.js";
import {Float32Tag} from "../../../client/common/compound/int/Float32Tag.js";
import {Int32Tag} from "../../../client/common/compound/int/Int32Tag.js";
import {randomUUID} from "crypto";

let _entityId = 0;

export class S_Entity extends Entity {
    static NBT_PRIVATE_STRUCTURE = new ObjectTag({
        uuid: new StringTag(""),
        x: new Float32Tag(0),
        y: new Float32Tag(0),
        vx: new Float32Tag(0),
        vy: new Float32Tag(0)
    });
    static NBT_PUBLIC_STRUCTURE = new ObjectTag({
        id: new Int32Tag(0),
        x: new Float32Tag(0),
        y: new Float32Tag(0),
        vx: new Float32Tag(0),
        vy: new Float32Tag(0)
    });

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

        const pri = this.constructor.NBT_PRIVATE_STRUCTURE.clone();
        const pub = this.constructor.NBT_PUBLIC_STRUCTURE.clone();

        pri.apply(nbt.value);
        pub.apply(nbt.value);
        pub.tags.id.value = this.id;

        /*** @type {ObjectTag} */
        this.__private_nbt = pri;
        /*** @type {ObjectTag} */
        this.__public_nbt = pub;

        const keys = Object.keys(this.__private_nbt.tags);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            this[k] = this.__private_nbt.tags[k].value;
        }

        this.uuid ||= randomUUID();
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

    getViewers() {
        return this.world.getChunkViewers(this.x >> 4);
    };

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
        this.__private_nbt.apply(this);
    };

    savePublicNBT() {
        const object = {};
        const keys = Object.keys(this.__public_nbt);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            object[k] = this[k];
        }
        this.__public_nbt.apply(object);
    };
}