import {PacketIds} from "../common/metadata/PacketIds.js";

export function BlockPlacePacket(x, y, id, meta) {
    return {type: PacketIds.CLIENT_PLACE_BLOCK, x, y, id, meta};
}