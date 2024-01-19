import {Command} from "../Command.js";
import {S_Server} from "../../Server.js";

export class StopCommand extends Command {
    constructor() {
        super("stop", "Stops the server.", "/stop", []);
    };

    execute(sender, args) {
        if (!S_Server.isOp(sender)) return Command.ERR_PERMISSION;
        S_Server.stop();
    };
}