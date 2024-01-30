let hasEverConnected = false;
let hasTriedSecure = false;
let connected = false;
let socket;
let init;

function makeSocket(secure = true) {
    socket = new WebSocket("ws" + (secure ? "s" : "") + init.url);
    socket.addEventListener("message", e => {
        const pk = JSON.parse(e.data);
        if (pk.type === init.SERVER_PING) {
            socket.send(JSON.stringify({type: init.CLIENT_PING}));
            return;
        }
        postMessage("0" + e.data);
    });
    socket.addEventListener("error", () => {
        if (!hasEverConnected && !hasTriedSecure) {
            hasTriedSecure = true;
            makeSocket(false);
        }
    });
    socket.addEventListener("open", () => {
        hasEverConnected = true;
        connected = true;
        postMessage("1");
    });
    socket.addEventListener("close", () => {
        connected = false;
        if (hasEverConnected) postMessage("2");
    });
}

onmessage = ({data}) => {
    init = JSON.parse(data);
    makeSocket(true);
    onmessage = ({data}) => {
        if (data === "!") return socket.close();
        socket.send(data);
    };
};