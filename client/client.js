import express from "express";
import path from "path";
import url from "url";

const PORT = 1923;

const root = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();

app.get("/game", (req, res) => res.sendFile("game.html", {root}));

app.use(express.static(root));

app.listen(PORT, () => {
    console.info("Client is being hosted at http://127.0.0.1:" + PORT);
});