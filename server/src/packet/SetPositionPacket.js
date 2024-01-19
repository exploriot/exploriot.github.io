import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function SetPositionPacket(x, y) {
    return {type: PacketIds.SERVER_SET_POSITION, x, y};
}