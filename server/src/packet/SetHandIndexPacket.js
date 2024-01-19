import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function SetHandIndexPacket(index) {
    return {type: PacketIds.SERVER_HAND_ITEM_INDEX, index};
}