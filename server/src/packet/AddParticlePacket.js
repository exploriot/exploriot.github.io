import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function AddParticlePacket(particleId, x, y, extra = null) {
    return {type: PacketIds.SERVER_ADD_PARTICLE, particleId, x, y, extra};
}