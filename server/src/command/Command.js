export class Command {
    static ERR_USAGE = 1;
    static ERR_PERMISSION = 2;
    static ERR_INVALID = 3;

    constructor(name, description, usage, aliases = [], permission = false) {
        this.name = name;
        this.description = description;
        this.usage = usage;
        this.aliases = aliases;
        this.permission = permission;
    };

    init() {
    };

    /**
     * @param {S_Player | CommandSender} sender
     * @param {string[]} args
     * @return {any}
     */
    execute(sender, args) {
        return Command.ERR_INVALID;
    };
}