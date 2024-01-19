import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function EntityMovementPacket(id, x, y) {
    return {type: PacketIds.SERVER_ENTITY_MOVEMENT, id, x, y};
}