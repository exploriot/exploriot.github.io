import {PacketIds} from "../common/metadata/PacketIds.js";

export function AuthPacket(username) {
    return {type: PacketIds.CLIENT_AUTH, username};
}