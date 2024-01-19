const serversBtn = document.getElementById("servers-btn");
const optionsBtn = document.getElementById("options-btn");
const addServerBtn = document.getElementById("add-server-btn");
const addServerMenuBtn = document.getElementById("add-server-menu-btn");
const serversMenu = document.getElementById("servers-menu");
const serverAddMenu = document.getElementById("server-add-menu");
const optionsMenu = document.getElementById("options-menu");
const messageMenu = document.getElementById("message-menu");
const bg = document.getElementById("bg");
const searchInp = document.getElementById("search");
const usernameInp = document.getElementById("username");
const serversD = document.querySelector(".servers");
let lastSearch = "";
let lastUsername = localStorage.getItem("__block__game__username__") || "Steve";

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
    serversMenu.classList.add("gone");
    serverAddMenu.classList.add("gone");
    optionsMenu.classList.add("gone");
    messageMenu.classList.add("gone");
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

addServerBtn.addEventListener("click", () => {
    const name = document.getElementById("create-name");
    const ip = document.getElementById("create-ip");
    const port = document.getElementById("create-port");
    const er = e => document.querySelector(".error").innerText = e;
    if (!name.value) return er("The name of the server cannot be empty.");
    if (!ip.value) return er("The IP of the server cannot be empty.");
    if (!port.value) return er("The port of the server cannot be empty.");
    if (!/^[\da-zA-Z.\-]+$/.test(ip.value)) return er("Invalid IP address.");
    const portN = Number(port.value);
    if (!port.value || isNaN(portN) || portN < 0 || portN > 65535 || portN !== Math.floor(portN)) return er("Invalid port.");
    servers.splice(0, 0, {
        name: name.value,
        ip: ip.value,
        port: portN,
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
        nameD.innerText = server.name;
        ipD.innerText = server.ip + ":" + server.port;
        removeD.innerText = "Delete";
        nameD.classList.add("name");
        ipD.classList.add("ip");
        removeD.classList.add("remove");
        div.appendChild(nameD);
        div.appendChild(ipD);
        div.appendChild(removeD);
        removeD.addEventListener("click", () => {
            servers.splice(servers.indexOf(server), 1);
            renderServers();
            localStorage.setItem("server-list", JSON.stringify(servers));
        });
        div.addEventListener("click", async e => {
            if (e.target !== div) return;
            closeUI();
            messageMenu.innerHTML = `<div class="text">Joining the server...</div>`;
            messageMenu.classList.remove("gone");
            bg.classList.remove("gone");
            let protocol = "http";
            let response = await fetch("http://" + server.ip + (server.port !== 80 ? ":" + server.port : "")).then(r => r).catch(r => r);
            if (response instanceof Error) {
                response = await fetch("https://" + server.ip + (server.port !== 80 ? ":" + server.port : "")).then(r => r).catch(r => r);
                protocol = "https";
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