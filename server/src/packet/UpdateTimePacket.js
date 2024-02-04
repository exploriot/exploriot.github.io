import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function UpdateTimePacket(time) {
    return {type: PacketIds.SERVER_UPDATE_TIME, time};
}