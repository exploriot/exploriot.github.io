import {PacketIds} from "../common/metadata/PacketIds.js";

export function BlockBreakPacket(x, y) {
    return {type: PacketIds.CLIENT_BREAK_BLOCK, x, y};
}