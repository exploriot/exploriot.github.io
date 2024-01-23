import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function PlaySoundPacket(id, isAmbient) {
    return {type: PacketIds.SERVER_PLAY_SOUND, id, isAmbient};
}