import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function BlockUpdatePacket(x, y, id, meta) {
    return {type: PacketIds.SERVER_BLOCK_UPDATE, x, y, id, meta};
}