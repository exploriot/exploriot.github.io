import {PacketIds} from "../common/metadata/PacketIds.js";

export function TouchEntityPacket(entityId, button) {
    return {type: PacketIds.CLIENT_TOUCH_ENTITY, entityId, button};
}