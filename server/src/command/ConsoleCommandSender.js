import {CommandSender} from "./CommandSender.js";
import {Terminal} from "../../../client/common/Utils.js";

export const ConsoleCommandSender = new class extends CommandSender {
    username = "Server";

    sendMessage(message) {
        Terminal.info(message);
    };
};

global._ConsoleCommandSender = ConsoleCommandSender;