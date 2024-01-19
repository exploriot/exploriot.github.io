import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function WelcomePacket(chunkDistance, entityId) {
    return {type: PacketIds.SERVER_WELCOME, chunkDistance, entityId};
}