import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function PlaySoundPacket(file, x, y) {
    return {type: PacketIds.SERVER_PLAY_SOUND, file, x, y};
}