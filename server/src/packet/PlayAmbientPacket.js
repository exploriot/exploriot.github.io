import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function PlayAmbientPacket(file) {
    return {type: PacketIds.SERVER_PLAY_AMBIENT, file};
}