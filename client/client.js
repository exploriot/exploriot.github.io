import express from "express";
import path from "path";
import url from "url";

const PORT = 1923;

const root = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();

app.get("/game", (req, res) => res.sendFile("game.html", {root}));

app.use(express.static(root));

// todo: make 2 chats one being shown if T is not pressed, one for when T is pressed.
//  the one when T is not pressed will only have messages that disappear after 2 seconds

app.listen(PORT, () => {
    console.info("Client is being hosted at http://127.0.0.1:" + PORT);
});