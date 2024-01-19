import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function SendMessagePacket(message) {
    return {type: PacketIds.SERVER_SEND_MESSAGE, message};
}