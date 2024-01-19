import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function InventorySetIndexPacket(id, index, item) {
    return {type: PacketIds.SERVER_INVENTORY_SET_INDEX, id, index, item};
}