import {PacketIds} from "../common/metadata/PacketIds.js";

export function InteractBlockPacket(x, y) {
    return {type: PacketIds.CLIENT_INTERACT_BLOCK, x, y};
}