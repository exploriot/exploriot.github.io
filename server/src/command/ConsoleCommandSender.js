import {Terminal} from "../terminal/Terminal.js";
import {CommandSender} from "./CommandSender.js";

export const ConsoleCommandSender = new class extends CommandSender {
    username = "Server";

    sendMessage(message) {
        Terminal.send(message);
    };
};

global._ConsoleCommandSender = ConsoleCommandSender;