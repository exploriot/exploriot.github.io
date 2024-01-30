import {AdvancedCommand} from "../AdvancedCommand.js";

export class StatusCommand extends AdvancedCommand {
    constructor() {
        super(
            "status",
            "Shows the status of the server.",
            [],
            true
        );
    };

    executor = {
        ""(sender) {
            sender.sendMessage("§e--- Status ---");
            sender.sendMessage("§aUPS: " + Server.ups + " update/s");
            sender.sendMessage("§e--- Status ---");
        }
    };
}