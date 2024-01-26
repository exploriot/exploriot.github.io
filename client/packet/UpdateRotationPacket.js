import {PacketIds} from "../common/metadata/PacketIds.js";

export function UpdateRotationPacket(rotation) {
    return {type: PacketIds.CLIENT_UPDATE_ROTATION, rotation};
}