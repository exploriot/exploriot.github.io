import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function PlaySoundPacket(file, x, y, volume) {
    return {type: PacketIds.SERVER_PLAY_SOUND, file, x, y, volume};
}