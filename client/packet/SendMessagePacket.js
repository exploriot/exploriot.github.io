import {PacketIds} from "../common/metadata/PacketIds.js";

export function SendMessagePacket(message) {
    return {type: PacketIds.CLIENT_SEND_MESSAGE, message};
}