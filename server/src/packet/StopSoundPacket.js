import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function StopSoundPacket(id) {
    return {type: PacketIds.SERVER_STOP_SOUND, id};
}