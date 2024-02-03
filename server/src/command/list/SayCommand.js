import {AdvancedCommand} from "../AdvancedCommand.js";

export class SayCommand extends AdvancedCommand {
    constructor() {
        super(
            "say",
            "Broadcasts a message.",
            [],
            true
        );
    };

    executor = {
        "<spread_text>"(sender, [text]) {
            Server.broadcastMessage("§d[" + sender.username + "] " + text);
        }
    };
}