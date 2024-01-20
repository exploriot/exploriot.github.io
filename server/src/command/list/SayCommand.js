import {Command} from "../Command.js";

export class SayCommand extends Command {
    constructor() {
        super(
            "say",
            "Broadcasts a message.",
            "",
            [],
            true
        );
    };

    execute(sender, args) {
        Server.broadcastMessage("§d[" + sender.username + "] " + args.join(" "));
    };
}