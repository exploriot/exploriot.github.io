import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function EntityVelocityPacket(id, vx, vy) {
    return {type: PacketIds.SERVER_ENTITY_VELOCITY, id, vx, vy};
}