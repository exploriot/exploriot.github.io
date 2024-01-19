import {PacketIds} from "../common/metadata/PacketIds.js";

export function CloseContainerPacket() {
    return {type: PacketIds.CLIENT_CLOSE_CONTAINER};
}