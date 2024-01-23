import {PacketIds} from "../common/metadata/PacketIds.js";

export function InventoryTransactionPacket(id1, id2, index1, index2, count) {
    return {type: PacketIds.CLIENT_INVENTORY_TRANSACTION, id1, id2, index1, index2, count};
}