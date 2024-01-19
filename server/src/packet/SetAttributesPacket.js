import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function SetAttributesPacket(attributes) {
    return {type: PacketIds.SERVER_SET_ATTRIBUTES, attributes};
}