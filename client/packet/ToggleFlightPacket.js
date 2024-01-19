import {PacketIds} from "../common/metadata/PacketIds.js";

export function ToggleFlightPacket() {
    return {type: PacketIds.CLIENT_TOGGLE_FLIGHT};
}