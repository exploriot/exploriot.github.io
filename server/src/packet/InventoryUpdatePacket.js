import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function InventoryUpdatePacket(id, contents, extra = {}) {
    return {type: PacketIds.SERVER_INVENTORY_UPDATE, id, contents, ...extra};
}