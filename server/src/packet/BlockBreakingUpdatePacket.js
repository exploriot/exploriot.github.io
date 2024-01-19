import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function BlockBreakingUpdatePacket(id, position) {
    return {type: PacketIds.SERVER_BLOCK_BREAKING_UPDATE, id, position};
}