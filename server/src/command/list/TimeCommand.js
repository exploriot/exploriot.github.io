import {AdvancedCommand} from "../AdvancedCommand.js";

export class TimeCommand extends AdvancedCommand {
    constructor() {
        super(
            "time",
            "Manages the time of the world.",
            [],
            true
        );
    };

    executor = {
        "@p (add) <seconds: float>"(player, [_, time]) {
            player.world.setTime(player.world.getTime() + time);
            player.sendMessage("Added " + time + " seconds to the time of your world.");
        },
        "(add) <world> <seconds: float>"(sender, [_, world, time]) {
            world.setTime(world.getTime() + time);
            sender.sendMessage("Added " + time + " seconds to the time in the world " + world.name + ".");
        },
        "@p (set) <seconds: float>"(player, [_, time]) {
            player.world.setTime(time);
            player.sendMessage("Set the time to " + time + " seconds in your world.");
        },
        "(set) <world> <seconds: float>"(sender, [_, world, time]) {
            world.setTime(time);
            sender.sendMessage("Added " + time + " seconds to the time in the world " + world.name + ".");
        },
        "@p (query) (:daytime | gametime | day)"(player, [_, type]) {
            this["(query) <world> (:daytime | gametime | day)"](player, [_, player.world, type]);
        },
        "(query) <world> (:daytime | gametime | day)"(sender, [_, world, type]) {
            switch (type) {
                case "daytime":
                    sender.sendMessage("The day time is " + Math.floor(world.getTime()) + " seconds.");
                    break;
                case "gametime":
                    sender.sendMessage("The day time is " + Math.floor(world.time) + "seconds");
                    break;
                case "day":
                    sender.sendMessage("So far " + Math.floor(world.getDay()) + " days have passed.");
                    break;
            }
        }
    };
}