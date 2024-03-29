import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function EntityAnimationPacket(entityId, animationId, extra = {}) {
    return {type: PacketIds.SERVER_ENTITY_ANIMATION, entityId, animationId, ...extra};
}