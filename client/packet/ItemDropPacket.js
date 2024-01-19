import {PacketIds} from "../common/metadata/PacketIds.js";

export function ItemDropPacket(id, index, count) {
    return {type: PacketIds.CLIENT_ITEM_DROP, id, index, count};
}