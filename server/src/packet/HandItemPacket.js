import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function HandItemPacket(id, item) {
    return {type: PacketIds.SERVER_HAND_ITEM, id, item};
}