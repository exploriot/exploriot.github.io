import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function UpdatePlayerListPacket(list) {
    return {type: PacketIds.SERVER_UPDATE_PLAYER_LIST, list};
}