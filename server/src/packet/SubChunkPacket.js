import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function SubChunkPacket(x, y, blocks) {
    return {type: PacketIds.SERVER_SUB_CHUNK, x, y, blocks: Array.from(blocks)};
}