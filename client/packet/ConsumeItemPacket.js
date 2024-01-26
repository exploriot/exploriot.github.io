import {PacketIds} from "../common/metadata/PacketIds.js";

export function ConsumeItemPacket() {
    return {type: PacketIds.CLIENT_CONSUME_ITEM};
}