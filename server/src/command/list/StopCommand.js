import {AdvancedCommand} from "../AdvancedCommand.js";

export class StopCommand extends AdvancedCommand {
    constructor() {
        super(
            "stop",
            "Stops the server.",
            "",
            [],
            true
        );
    };

    executor = {
        ""() {
            Server.stop();
        }
    };
}