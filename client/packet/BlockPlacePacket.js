import {PacketIds} from "../common/metadata/PacketIds.js";

export function BlockPlacePacket(x, y, rotation) {
    return {type: PacketIds.CLIENT_PLACE_BLOCK, x, y, rotation};
}