import {PacketIds} from "../common/metadata/PacketIds.js";

export function BlockBreakingUpdatePacket(x, y, state) {
    return {type: PacketIds.CLIENT_BLOCK_BREAKING_UPDATE, x, y, state};
}