import {PacketIds} from "../common/metadata/PacketIds.js";

export function BatchPacket(packets) {
    return {type: PacketIds.BATCH, packets};
}