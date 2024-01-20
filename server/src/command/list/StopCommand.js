import {Command} from "../Command.js";

export class StopCommand extends Command {
    constructor() {
        super(
            "stop",
            "Stops the server.",
            "",
            [],
            true
        );
    };

    execute(sender, args) {
        Server.stop();
    };
}