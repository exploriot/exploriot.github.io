import {PacketIds} from "../common/metadata/PacketIds.js";

export function MovementPacket(x, y) {
    return {type: PacketIds.CLIENT_MOVEMENT, x, y};
}