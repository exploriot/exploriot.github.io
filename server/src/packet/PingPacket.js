import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function PingPacket() {
    return {type: PacketIds.SERVER_PING};
}