onmessage = ({data: init}) => {
    init = JSON.parse(init);
    let hasTriedSecure = false;
    let connected = false;
    let socket = new WebSocket("ws" + init.url);
    socket.addEventListener("message", e => {
        const pk = JSON.parse(e.data);
        if (pk.type === init.SERVER_PING) {
            socket.send(JSON.stringify({type: init.CLIENT_PING}));
            return;
        }
        postMessage("0" + e.data);
    });
    socket.addEventListener("error", () => {
        if (!connected || !hasTriedSecure) {
            socket = new WebSocket("wss" + init.url);
        }
    });
    socket.addEventListener("open", () => {
        connected = true;
        postMessage("1");
    });
    socket.addEventListener("close", () => {
        connected = false;
        postMessage("2");
    });
    onmessage = ({data}) => {
        if (data === "!") return socket.close();
        socket.send(data);
    };
};