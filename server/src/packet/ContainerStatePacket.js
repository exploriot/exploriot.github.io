import {PacketIds} from "../../../client/common/metadata/PacketIds.js";

export function ContainerStatePacket(state) {
    return {type: PacketIds.SERVER_CONTAINER_STATE, state};
}