import express from "express";
import path from "node:path";
import url from "node:url";

const root = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();

app.get("/game", (req, res) => res.sendFile("game.html", {root}));

app.use(express.static(root));

app.listen(1923);