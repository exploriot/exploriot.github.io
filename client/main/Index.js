import {Texture} from "../loader/Texture.js";
import DefaultSkin from "./DefaultSkin.js";
import {clearDiv} from "../Utils.js";

const serversBtn = document.getElementById("servers-btn");
const optionsBtn = document.getElementById("options-btn");
const addServerBtn = document.getElementById("add-server-btn");
const addServerMenuBtn = document.getElementById("add-server-menu-btn");
const editServerBtn = document.getElementById("edit-server-btn");
const serversMenu = document.getElementById("servers-menu");
const serverAddMenu = document.getElementById("server-add-menu");
const serverEditMenu = document.getElementById("server-edit-menu");
const optionsMenu = document.getElementById("options-menu");
const messageMenu = document.getElementById("message-menu");
const messageMenuText = document.querySelector("#message-menu > .text");
const uploadSkinBtn = document.querySelector(".upload-skin");
const resetSkinBtn = document.querySelector(".reset-skin");
const cancel0Btn = document.getElementById("add-server-cancel-btn");
const cancel1Btn = document.getElementById("edit-server-cancel-btn");
const usernameView = document.querySelector(".username-view");
const bg = document.getElementById("bg");
const searchInp = document.getElementById("search");
const usernameInp = document.getElementById("username");
const serversD = document.querySelector(".servers");
let lastSearch = "";
let lastUsername = localStorage.getItem("__block__game__username__") || "Steve";
let lastSkinData = localStorage.getItem("__block__game__skin__") || DefaultSkin;
let skinTexture = Texture.get(lastSkinData);
let editingServer = null;
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const playerDiv = document.querySelector(".player");
let mouseX = 0;
let mouseY = 0;

function closeUI() {
    editingServer = null;
    serversMenu.classList.add("gone");
    serverAddMenu.classList.add("gone");
    optionsMenu.classList.add("gone");
    messageMenu.classList.add("gone");
    serverEditMenu.classList.add("gone");
    bg.classList.add("gone");
    clearDiv(document.querySelector(".error"));
}

function checkServerProps(name, ip, port) {
    if (!name) return "The name of the server cannot be empty.";
    if (!ip) return "The IP of the server cannot be empty.";
    if (!port) return "The port of the server cannot be empty.";
    if (!/^[\da-zA-Z.\-]+$/.test(ip)) return "Invalid IP address.";
    const portN = Number(port);
    if (!port || isNaN(portN) || portN < 0 || portN > 65535 || portN !== Math.floor(portN)) return "Invalid port.";
}

const servers = JSON.parse(localStorage.getItem("server-list") ?? "[]").sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);

function renderServers() {
    clearDiv(serversD);
    for (const server of servers.filter(i => !lastSearch || i.name.toLowerCase().split(" ").some(i => lastSearch.toLowerCase().split(" ").some(j => i.includes(j))))) {
        const div = document.createElement("div");
        div.classList.add("server");
        const nameD = document.createElement("div");
        const ipD = document.createElement("div");
        const removeD = document.createElement("div");
        const editD = document.createElement("div");
        nameD.innerText = server.name;
        ipD.innerText = server.ip + ":" + server.port;
        removeD.innerText = "Delete";
        editD.innerText = "Edit";
        nameD.classList.add("name");
        ipD.classList.add("ip");
        removeD.classList.add("remove");
        editD.classList.add("edit");
        div.appendChild(nameD);
        div.appendChild(ipD);
        div.appendChild(removeD);
        div.appendChild(editD);
        removeD.addEventListener("click", () => {
            servers.splice(servers.indexOf(server), 1);
            renderServers();
            localStorage.setItem("server-list", JSON.stringify(servers));
        });
        editD.addEventListener("click", () => {
            editingServer = server;
            serversMenu.classList.add("gone");
            serverEditMenu.classList.remove("gone");
            document.getElementById("edit-name").value = server.name;
            document.getElementById("edit-ip").value = server.ip;
            document.getElementById("edit-port").value = server.port;
        });
        div.addEventListener("click", async e => {
            if (e.target !== div) return;
            serversMenu.classList.add("gone");

            messageMenuText.innerText = "Joining the server...";
            messageMenu.classList.remove("gone");

            bg.classList.remove("gone");
            let protocol = "ws";
            let response = await fetch("http://" + server.ip + (server.port !== 80 ? ":" + server.port : "")).then(r => r).catch(r => r);
            if (response instanceof Error) {
                response = await fetch("https://" + server.ip + (server.port !== 80 ? ":" + server.port : "")).then(r => r).catch(r => r);
                protocol = "wss";
                if (response instanceof Error) {
                    messageMenuText.innerText = "Couldn't connect to the server...";
                    messageMenu.classList.remove("gone");
                    return;
                }
            }
            const text = await response.text().then(r => r).catch(r => r);
            if (text !== "block-game") {
                messageMenuText.innerText = "Invalid server.";
                messageMenu.classList.remove("gone");
                return;
            }
            location.href = `./game.html?ip=${server.ip}&port=${server.port}&protocol=${protocol}`;
        });
        serversD.appendChild(div);
    }
}

function onResize() {
    const box = playerDiv.getBoundingClientRect();
    canvas.width = box.width;
    canvas.height = box.height;
    ctx.imageSmoothingEnabled = false;
}

function animate() {
    requestAnimationFrame(animate);
    const skin = skinTexture.skin();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!skin) return;
    const box = playerDiv.getBoundingClientRect();
    const w = canvas.width * .64;
    const h = canvas.height * .64;
    const tx = (canvas.width - w) / 2;
    const ty = (canvas.height - h) / 2;
    const headX = box.x + tx + w / 2;
    const headY = box.y + ty + w / 2;
    const side = skin[mouseX > headX ? 0 : 1];
    let angle = Math.atan2(mouseY - headY, mouseX - headX);
    if (mouseX < headX) {
        angle += Math.PI;
    }
    const armBody = [
        tx + w / 2 - 0.25 * w, tx + w + 0.8 * w,
        w * 0.5, w * 1.5
    ];

    ctx.drawImage(side.back_arm, ...armBody);
    ctx.drawImage(side.body, ...armBody);
    ctx.drawImage(side.front_arm, ...armBody);

    const leg = [
        tx + w / 2 - 0.25 * w, tx + w + 2.3 * w,
        w * 0.5, w * 1.5
    ];

    ctx.drawImage(side.back_leg, ...leg);
    ctx.drawImage(side.front_leg, ...leg);

    ctx.save();
    ctx.translate(tx + w / 2, ty + w / 2);
    ctx.rotate(angle);
    ctx.drawImage(side.head, -w / 2, -w / 2, w, w);
    ctx.restore();

    ctx.save();
    ctx.translate(tx + w / 2 - w * 0.015, ty + w / 2 - w * 0.015);
    ctx.rotate(angle);
    ctx.drawImage(side.head_topping, -w / 2 - w * 0.015, -w / 2 - w * 0.015, w * 1.03, w * 1.03);
    ctx.restore();
}

export function initIndex() {
    usernameInp.value = lastUsername;
    usernameView.innerText = lastUsername;

    document.querySelectorAll(".close").forEach(i => i.addEventListener("click", closeUI));

    addEventListener("mousemove", e => {
        if (!bg.classList.contains("gone")) return;
        mouseX = e.pageX;
        mouseY = e.pageY;
    });

    serversBtn.addEventListener("click", () => {
        bg.classList.remove("gone");
        serversMenu.classList.remove("gone");
        searchInp.value = "";
    });

    optionsBtn.addEventListener("click", () => {
        bg.classList.remove("gone");
        optionsMenu.classList.remove("gone");
    });

    window.closeUI = closeUI;

    addEventListener("keydown", e => {
        if (e.key === "Escape") closeUI();
    });

    addServerMenuBtn.addEventListener("click", () => {
        serversMenu.classList.add("gone");
        serverAddMenu.classList.remove("gone");
        document.getElementById("create-name").value = "My server";
        document.getElementById("create-ip").value = "";
        document.getElementById("create-port").value = "1881";
    });

    editServerBtn.addEventListener("click", () => {
        if (!editingServer) return closeUI();
        const name = document.getElementById("edit-name").value;
        const ip = document.getElementById("edit-ip").value;
        const port = document.getElementById("edit-port").value;
        const res = checkServerProps(name, ip, port);
        if (res) return document.querySelector("#edit-error").innerText = res;
        editingServer.name = name;
        editingServer.ip = ip;
        editingServer.port = port;
        renderServers();
        serversMenu.classList.remove("gone");
        serverEditMenu.classList.add("gone");
        localStorage.setItem("server-list", JSON.stringify(servers));
    });

    addServerBtn.addEventListener("click", () => {
        const name = document.getElementById("create-name").value;
        const ip = document.getElementById("create-ip").value;
        const port = document.getElementById("create-port").value;
        const res = checkServerProps(name, ip, port);
        if (res) return document.querySelector("#add-error").innerText = res;
        servers.splice(0, 0, {
            name: name,
            ip: ip,
            port: port * 1,
            createdTimestamp: Date.now(),
            joinedTimestamp: Date.now()
        });
        renderServers();
        serversMenu.classList.remove("gone");
        serverAddMenu.classList.add("gone");
        localStorage.setItem("server-list", JSON.stringify(servers));
    });

    uploadSkinBtn.addEventListener("click", async () => {
        try {
            const [fileHandle] = await showOpenFilePicker({
                types: [
                    {
                        description: "Images",
                        accept: {
                            "image/*": [".jpg", ".jpeg", ".png"],
                        }
                    }
                ]
            });
            const file = await fileHandle.getFile();
            const ext = file.name.split(".").at(-1);
            const reader = new FileReader();
            reader.onload = async event => {
                /*** @type {ArrayBuffer} */
                const buffer = event.target.result;
                const uint8Array = new Uint8Array(buffer);
                const base64String = btoa(String.fromCharCode.apply(null, uint8Array));
                lastSkinData = "data:image/" + ext + ";base64," + base64String;
                skinTexture.destroy();
                skinTexture = Texture.get(lastSkinData);
                localStorage.setItem("__block__game__skin__", lastSkinData);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error(error);
        }
    });

    resetSkinBtn.addEventListener("click", async () => {
        lastSkinData = DefaultSkin;
        skinTexture.destroy();
        skinTexture = Texture.get(lastSkinData);
        localStorage.setItem("__block__game__skin__", lastSkinData);
    });

    cancel0Btn.addEventListener("click", () => {
        serverAddMenu.classList.add("gone");
        serversMenu.classList.remove("gone");
    });

    cancel1Btn.addEventListener("click", () => {
        serverEditMenu.classList.add("gone");
        serversMenu.classList.remove("gone");
    });

    renderServers();

    setInterval(() => {
        if (searchInp.value !== lastSearch) {
            lastSearch = searchInp.value;
            renderServers();
        }
        if (usernameInp.value !== lastUsername) {
            lastUsername = usernameInp.value;
            usernameView.innerText = lastUsername;
            localStorage.setItem("__block__game__username__", lastUsername);
        }
    });

    addEventListener("resize", onResize);

    onResize();

    animate();
}

if (["", "index.html", "index"].includes(location.pathname.split("/").at(-1))) initIndex();