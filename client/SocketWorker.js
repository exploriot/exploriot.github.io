onmessage = ({data: init}) => {
    init = JSON.parse(init);
    const socket = new WebSocket(init.url);
    socket.addEventListener("message", e => {
        const pk = JSON.parse(e.data);
        if (pk.type === init.SERVER_PING) {
            socket.send(JSON.stringify({type: init.CLIENT_PING}));
            return;
        }
        postMessage("0" + e.data);
    });
    socket.addEventListener("open", () => postMessage("1"));
    socket.addEventListener("close", () => postMessage("2"));
    onmessage = ({data}) => {
        if (data === "!") return socket.close();
        socket.send(data);
    };
};