import {HelpCommand} from "./list/HelpCommand.js";
import {TeleportCommand} from "./list/TeleportCommand.js";
import {GiveCommand} from "./list/GiveCommand.js";
import {OpCommand} from "./list/OpCommand.js";
import {DeopCommand} from "./list/DeopCommand.js";
import {StopCommand} from "./list/StopCommand.js";
import {GamemodeCommand} from "./list/GamemodeCommand.js";
import {ClearCommand} from "./list/ClearCommand.js";
import {KickCommand} from "./list/KickCommand.js";

export const CommandLabels = {};
export const Commands = new Set;

export function registerCommand(command) {
    if (Commands.has(command) || command.name in CommandLabels) throw new Error("Command already exists: " + command.name);
    Commands.add(command);
    CommandLabels[command.name] = command;
    for (const alias of command.aliases) {
        if (alias in Commands) throw new Error("Command(alias) already exists: " + alias);
        CommandLabels[alias] = command;
    }
}

export function registerCommands(...commands) {
    for (const cmd of commands) {
        registerCommand(cmd);
    }
}

registerCommands(
    new HelpCommand,
    new TeleportCommand,
    new GiveCommand,
    new OpCommand,
    new DeopCommand,
    new StopCommand,
    new GamemodeCommand,
    new ClearCommand,
    new KickCommand
);