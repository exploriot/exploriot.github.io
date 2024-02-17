import express from "express";
import path from "path";
import url from "url";
import {getCurrentIP, getCurrentPort, getCurrentURL, Terminal} from "./common/Utils.js";

const T = Date.now();

const PORT = 1923;

const root = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();

app.get("/game", (req, res) => res.sendFile("game.html", {root}));

app.use(express.static(root));

// todo: make 2 chats one being shown if T is not pressed, one for when T is pressed.
//  the one when T is not pressed will only have messages that disappear after 2 seconds

app.listen(PORT, () => {
    const url = getCurrentURL(process, PORT);
    if (!("_MIDDLE_" in global)) Terminal.info("Client has been loaded in " + (Date.now() - T) / 1000 + "s.");
    Terminal.info("Client URL: " + url);
    if ("_MIDDLE_" in global) Terminal.info(
        "You can join the current host at: " + url + "/game.html#"
        + getCurrentIP(process) + ":" + getCurrentPort(process, Server.port)
    );
});