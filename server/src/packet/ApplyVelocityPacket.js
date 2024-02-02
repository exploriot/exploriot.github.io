import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function ApplyVelocityPacket(vx, vy) {
    return {type: PacketIds.SERVER_APPLY_VELOCITY, vx, vy};
}