import {PacketIds} from "../common/metadata/PacketIds.js";

export function AuthPacket(username, skinData) {
    return {type: PacketIds.CLIENT_AUTH, username, skinData};
}