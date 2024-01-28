import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function AddParticlePacket(id, x, y, extra = {}) {
    return {type: PacketIds.SERVER_ADD_PARTICLE, id, x, y, ...extra};
}