import {PacketIds} from "../common/metadata/PacketIds.js";

export function ItemTransferPacket(id1, id2, index1, count) {
    return {type: PacketIds.CLIENT_ITEM_TRANSFER, id1, id2, index1, count};
}