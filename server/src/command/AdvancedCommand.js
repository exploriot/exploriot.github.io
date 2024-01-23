import {Command} from "./Command.js";
import {processSelector, Selectors, testArguments, tokenize} from "./CommandUtils.js";

export class AdvancedCommand extends Command {
    constructor(name, description, aliases = [], permission = false) {
        super(name, description, null, aliases, permission);
    };

    init() {
        this.__usage = Object.keys(this.executor).map(i => {
            i = i.replaceAll(" ", "");
            let sel, selT;
            if (i[0] === "@") {
                sel = {};
                selT = i[1];
                if (selT === "r" || !Selectors.includes(selT)) Server.crash("Command usage selector can't be set to @r.");
                if (i[2] === "[") {
                    const tokens = tokenize(i.substring(2));
                    if (typeof tokens === "string") Server.crash(tokens);
                    const token = tokens[0];
                    if (!token || token.type !== "parent" || token.value !== "[") {
                        Server.crash("Expected a valid parent expression before the usage.");
                    }
                    const res = processSelector(token.children, sel);
                    if (typeof res === "string") Server.crash(res);
                }
            }
            return {
                sel, selT,
                pos: Array.from(i.matchAll(/<[^>]+>/g)).map(i => {
                    const s = i[0].slice(1, -1).split(":");
                    return [s[0], s[1].split(",")];
                })
            };
        });
    };

    execute(sender, args) {
        const res = testArguments(sender, sender, args.join(" "), this.__usage);
        if (typeof res === "string") return sender.sendMessage("§c" + res);
        if (!res) return Command.ERR_USAGE;
        const keys = Object.keys(this.executor);
        this.executor[keys[res[0]]](sender, res[1]);
    };
}