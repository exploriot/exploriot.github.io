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
const bg = document.getElementById("bg");
const searchInp = document.getElementById("search");
const usernameInp = document.getElementById("username");
const serversD = document.querySelector(".servers");
let lastSearch = "";
let lastUsername = localStorage.getItem("__block__game__username__") || "Steve";
let editingServer = null;

usernameInp.value = lastUsername;

serversBtn.addEventListener("click", () => {
    bg.classList.remove("gone");
    serversMenu.classList.remove("gone");
    searchInp.value = "";
});

optionsBtn.addEventListener("click", () => {
    bg.classList.remove("gone");
    optionsMenu.classList.remove("gone");
});

function closeUI() {
    editingServer = null;
    serversMenu.classList.add("gone");
    serverAddMenu.classList.add("gone");
    optionsMenu.classList.add("gone");
    messageMenu.classList.add("gone");
    serverEditMenu.classList.add("gone");
    bg.classList.add("gone");
    document.querySelector(".error").innerHTML = "";
}

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

function checkServerProps(name, ip, port) {
    if (!name) return "The name of the server cannot be empty.";
    if (!ip) return "The IP of the server cannot be empty.";
    if (!port) return "The port of the server cannot be empty.";
    if (!/^[\da-zA-Z.\-]+$/.test(ip)) return "Invalid IP address.";
    const portN = Number(port);
    if (!port || isNaN(portN) || portN < 0 || portN > 65535 || portN !== Math.floor(portN)) return "Invalid port.";
}

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

const servers = JSON.parse(localStorage.getItem("server-list") ?? "[]").sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);

function renderServers() {
    serversD.innerHTML = "";
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
            closeUI();
            editingServer = server;
            serverEditMenu.classList.remove("gone");
            document.getElementById("edit-name").value = server.name;
            document.getElementById("edit-ip").value = server.ip;
            document.getElementById("edit-port").value = server.port;
        });
        div.addEventListener("click", async e => {
            if (e.target !== div) return;
            closeUI();
            messageMenu.innerHTML = `<div class="text">Joining the server...</div>`;
            messageMenu.classList.remove("gone");
            bg.classList.remove("gone");
            let protocol = "ws";
            let response = await fetch("http://" + server.ip + (server.port !== 80 ? ":" + server.port : "")).then(r => r).catch(r => r);
            if (response instanceof Error) {
                response = await fetch("https://" + server.ip + (server.port !== 80 ? ":" + server.port : "")).then(r => r).catch(r => r);
                protocol = "wss";
                if (response instanceof Error) {
                    messageMenu.innerHTML = `<div class="text">Couldn't connect to the server.</div><div class="close" onclick="closeUI()">x</div>`;
                    return;
                }
            }
            const text = await response.text().then(r => r).catch(r => r);
            if (text !== "block-game") {
                messageMenu.innerHTML = `<div class="text">Invalid server.</div><div class="close" onclick="closeUI()">x</div>`;
                return;
            }
            location.href = `./game.html?ip=${server.ip}&port=${server.port}&protocol=${protocol}`;
        });
        serversD.appendChild(div);
    }
}

renderServers();

setInterval(() => {
    if (searchInp.value !== lastSearch) {
        lastSearch = searchInp.value;
        renderServers();
    }
    if (usernameInp.value !== lastUsername) {
        lastUsername = usernameInp.value;
        localStorage.setItem("__block__game__username__", lastUsername);
    }
});