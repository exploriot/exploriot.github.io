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
let editingServerUUID = null;
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const playerDiv = document.querySelector(".player");
let mouseX = 0;
let mouseY = 0;

function closeUI() {
    editingServerUUID = null;
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
    const portN = Number(port);
    if (!port || isNaN(portN) || portN < 0 || portN > 65535 || portN !== Math.floor(portN)) return "Invalid port.";
    if (ip !== "localhost") {
        if (/^\d+\.\d+\.\d+\.\d+$/) {
            const spl = ip.split(".").map(Number);
            if (spl.some(i => i < 0 || i > 255)) return "Invalid IP address.";
        } else if (!/^([a-zA-Z][\da-zA-Z\-]+\.)+[a-zA-Z][\da-zA-Z\-]+$/) return "Invalid IP address.";
    }
}

let _packed = JSON.parse(localStorage.getItem("server-list") ?? "[]");
if (!Array.isArray(_packed)) _packed = [];
const servers = {};
for (const server of _packed) servers[server.uuid] = server;

function saveServerList() {
    localStorage.setItem("server-list", JSON.stringify(Object.values(servers)));
}

function renderServers() {
    clearDiv(serversD);
    const serverList = Object.values(servers)
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter(i => {
            if (!lastSearch) return true;
            const spl = i.name.toLowerCase().split(" ");
            const searchSpl = lastSearch.toLowerCase().split(" ");
            return spl.some(i => searchSpl.some(j => i.includes(j)));
        });
    for (const server of serverList) {
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
            delete servers[server.uuid];
            renderServers();
            saveServerList();
        });
        editD.addEventListener("click", () => {
            editingServerUUID = server.uuid;
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
            location.href = `./game.html#${server.ip}:${server.port}`;
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

    // noinspection JSUnresolvedReference
    ctx.drawImage(side.back_arm, ...armBody);
    // noinspection JSUnresolvedReference
    ctx.drawImage(side.body, ...armBody);
    // noinspection JSUnresolvedReference
    ctx.drawImage(side.front_arm, ...armBody);

    const leg = [
        tx + w / 2 - 0.25 * w, tx + w + 2.3 * w,
        w * 0.5, w * 1.5
    ];

    // noinspection JSUnresolvedReference
    ctx.drawImage(side.back_leg, ...leg);
    // noinspection JSUnresolvedReference
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
        if (!editingServerUUID) return closeUI();
        const name = document.getElementById("edit-name").value;
        const ip = document.getElementById("edit-ip").value;
        const port = document.getElementById("edit-port").value;
        const res = checkServerProps(name, ip, port);
        if (res) return document.querySelector("#edit-error").innerText = res;
        const server = servers[editingServerUUID];
        server.name = name;
        server.ip = ip;
        server.port = port;
        server.timestamp = Date.now();
        serversMenu.classList.remove("gone");
        serverEditMenu.classList.add("gone");
        renderServers();
        saveServerList();
    });

    addServerBtn.addEventListener("click", () => {
        const name = document.getElementById("create-name").value;
        let ip = document.getElementById("create-ip").value;
        ip = ip.split("//");
        ip = ip[1] ?? ip[0];
        ip = ip.split("/")[0];
        const port = document.getElementById("create-port").value * 1;
        const res = checkServerProps(name, ip, port);
        if (res) return document.querySelector("#add-error").innerText = res;
        const uuid = crypto.randomUUID();
        servers[uuid] = {uuid, name, ip, port, timestamp: Date.now()};
        serversMenu.classList.remove("gone");
        serverAddMenu.classList.add("gone");
        renderServers();
        saveServerList();
    });

    uploadSkinBtn.addEventListener("click", async () => {
        try {
            // noinspection JSUnresolvedReference
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