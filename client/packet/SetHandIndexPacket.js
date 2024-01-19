import {PacketIds} from "../common/metadata/PacketIds.js";

export function SetHandIndexPacket(index) {
    return {type: PacketIds.CLIENT_HAND_ITEM, index};
}