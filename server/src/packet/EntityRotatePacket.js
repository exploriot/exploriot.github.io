import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function EntityRotatePacket(id, rotation) {
    return {type: PacketIds.SERVER_ENTITY_ROTATE, id, rotation};
}