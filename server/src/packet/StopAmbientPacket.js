import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function StopAmbientPacket(file) {
    return {type: PacketIds.SERVER_STOP_SOUND, file};
}