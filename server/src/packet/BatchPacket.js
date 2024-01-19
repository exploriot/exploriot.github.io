import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function BatchPacket(packets) {
    return {type: PacketIds.BATCH, packets};
}