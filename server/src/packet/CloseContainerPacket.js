import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function CloseContainerPacket() {
    return {type: PacketIds.SERVER_CLOSE_CONTAINER};
}