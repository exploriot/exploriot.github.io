import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function EntityUpdatePacket(entity) {
    return {type: PacketIds.SERVER_ENTITY_UPDATE, entity};
}