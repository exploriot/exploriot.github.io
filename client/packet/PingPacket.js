import {PacketIds} from "../common/metadata/PacketIds.js";

export function PingPacket() {
    return {type: PacketIds.CLIENT_PING};
}