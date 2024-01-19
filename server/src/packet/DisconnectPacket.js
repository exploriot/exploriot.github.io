import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function DisconnectPacket(reason) {
    return {type: PacketIds.SERVER_DISCONNECT, reason};
}