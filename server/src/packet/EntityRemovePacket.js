import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function EntityRemovePacket(id) {
    return {type: PacketIds.SERVER_ENTITY_REMOVE, id};
}