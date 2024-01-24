import {PacketIds} from "../common/metadata/PacketIds.js";

export function ObtainItemPacket(item, invId, invIndex) {
    return {type: PacketIds.CLIENT_OBTAIN_ITEM, item, invId, invIndex};
}