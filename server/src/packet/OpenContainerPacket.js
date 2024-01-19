import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function OpenContainerPacket(id) {
    return {type: PacketIds.SERVER_OPEN_CONTAINER, id};
}