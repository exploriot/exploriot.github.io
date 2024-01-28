import {BatchPacket} from "../packet/BatchPacket.js";
import {MovementPacket} from "../packet/MovementPacket.js";
import {CServer} from "../main/Game.js";
import {BlockPlacePacket} from "../packet/BlockPlacePacket.js";
import {BlockBreakPacket} from "../packet/BlockBreakPacket.js";
import {BlockBreakingUpdatePacket} from "../packet/BlockBreakingUpdatePacket.js";
import {SetHandIndexPacket} from "../packet/SetHandIndexPacket.js";
import {InventoryTransactionPacket} from "../packet/InventoryTransactionPacket.js";
import {AuthPacket} from "../packet/AuthPacket.js";
import {ItemDropPacket} from "../packet/ItemDropPacket.js";
import {SendMessagePacket} from "../packet/SendMessagePacket.js";
import {InteractBlockPacket} from "../packet/InteractBlockPacket.js";
import {CloseContainerPacket} from "../packet/CloseContainerPacket.js";
import {ToggleFlightPacket} from "../packet/ToggleFlightPacket.js";
import {C_handleCloseContainerPacket, C_handlePacket} from "./ClientPacketHandler.js";
import {PingPacket} from "../packet/PingPacket.js";
import {ItemTransferPacket} from "../packet/ItemTransferPacket.js";
import {AnimatorFrame} from "../ui/Animator.js";
import {roundToPrecision} from "../common/Utils.js";
import {PacketIds} from "../common/metadata/PacketIds.js";
import {ObtainItemPacket} from "../packet/ObtainItemPacket.js";
import {ConsumeItemPacket} from "../packet/ConsumeItemPacket.js";
import {UpdateRotationPacket} from "../packet/UpdateRotationPacket.js";
import {clearDiv, colorizeTextHTML} from "../Utils.js";

const connectionDiv = document.querySelector(".connection-menu");
const connectionText = document.querySelector(".connection-menu > .container > .text");
const rejoinBtn = document.querySelector("#rejoin-btn");
const query = new URLSearchParams(location.search);
const ip = query.get("ip");
const port = query.get("port");
const protocol = query.get("protocol");
let connected = false;

export const ClientSession = {
    queuedPackets: [],
    kickReason: null,
    worker: null,

    __init__() {
        this.worker = new Worker("./SocketWorker.js");

        this.worker.postMessage(JSON.stringify({
            url: protocol + "://" + ip + (port === "80" ? "" : ":" + port),
            CLIENT_PING: PacketIds.CLIENT_PING,
            SERVER_PING: PacketIds.SERVER_PING
        }));

        function onConnection() {
            connected = true;
            console.log("Connected.");
            ClientSession.sendAuthPacket();
            ClientSession.cleanPackets();
        }

        function onClose() {
            connected = false;
            console.log("Disconnected.");
            clearDiv(connectionText);
            connectionText.appendChild(colorizeTextHTML(ClientSession.kickReason ?? "§cDisconnected from the server."));
            connectionDiv.classList.remove("gone");
            rejoinBtn.classList.remove("gone");
            cancelAnimationFrame(AnimatorFrame);
        }

        this.worker.addEventListener("message", ({data}) => {
            switch (parseInt(data[0])) {
                case 0:
                    ClientSession.handlePacket(JSON.parse(data.substring(1)));
                    break;
                case 1:
                    onConnection();
                    break;
                case 2:
                    onClose();
                    break;
            }
        });
    },

    isConnected() {
        return connected;
    },

    sendPacket(pk, immediate = false) {
        if (immediate && connected) {
            this.worker.postMessage(JSON.stringify(pk));
        } else this.queuedPackets.push(pk);
    },

    sendPackets(packets, immediate = false) {
        if (packets.length === 0) return;
        if (packets.length === 1) return this.sendPacket(packets[0], immediate);
        if (immediate && connected) {
            this.sendPacket(BatchPacket(packets), true);
        } else this.queuedPackets.push(...packets);
    },

    sendPing() {
        ClientSession.sendPacket(PingPacket());
    },

    sendMovement() {
        this.sendPacket(MovementPacket(
            roundToPrecision(CServer.player.x, 3), roundToPrecision(CServer.player.y, 3)
        ));
    },

    sendRotation() {
        this.sendPacket(UpdateRotationPacket(roundToPrecision(CServer.player.rotation, 3)));
    },

    sendBlockPlacePacket(x, y, rotation) {
        this.sendPacket(BlockPlacePacket(x, y, rotation));
    },

    sendBlockBreakPacket(x, y) {
        this.sendPacket(BlockBreakPacket(x, y));
    },

    sendBlockBreakingUpdatePacket(x, y, state) {
        this.sendPacket(BlockBreakingUpdatePacket(x, y, state));
    },

    sendHandIndex() {
        this.sendPacket(SetHandIndexPacket(CServer.handIndex));
    },

    sendInventoryTransactionPacket(id1, id2, index1, index2, count) {
        this.sendPacket(InventoryTransactionPacket(id1, id2, index1, index2, count));
    },

    sendItemTransferPacket(id1, id2, index1, count) {
        this.sendPacket(ItemTransferPacket(id1, id2, index1, count));
    },

    sendAuthPacket() {
        this.sendPacket(AuthPacket(CServer.username, CServer.skinData), true);
    },

    sendDropItemPacket(id, index, count) {
        this.sendPacket(ItemDropPacket(id, index, count));
    },

    sendMessagePacket(message) {
        this.sendPacket(SendMessagePacket(message));
    },

    sendInteractBlockPacket(x, y) {
        this.sendPacket(InteractBlockPacket(x, y));
    },

    sendCloseContainerPacket() {
        this.sendPacket(CloseContainerPacket());
        C_handleCloseContainerPacket();
    },

    sendToggleFlightPacket() {
        this.sendPacket(ToggleFlightPacket());
    },

    sendObtainItemPacket(item, invId, invIndex) {
        this.sendPacket(ObtainItemPacket(item.serialize(), invId, invIndex));
    },

    sendConsumeItemPacket() {
        this.sendPacket(ConsumeItemPacket());
    },

    handlePacket(pk) {
        C_handlePacket(pk);
    },

    cleanPackets() {
        if (!connected) return;
        if (this.queuedPackets.length) this.sendPackets(this.queuedPackets, true);
        this.queuedPackets.length = 0;
    },

    close() {
        this.worker.postMessage("!");
    }
};