import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function OpenContainerPacket(data) {
    return {type: PacketIds.SERVER_OPEN_CONTAINER, data};
}