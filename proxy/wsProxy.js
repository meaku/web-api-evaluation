"use strict";

const WebSocketServer = require("ws").Server;
const WebSocket = require("ws");

function wsProxy(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", function connection(ws) {
        const req = ws.upgradeReq;
        //TODO wss or ws depending on origin
        const wsUrl = "wss://" + req.headers.host + req.url;

        let wsClient = new WebSocket(wsUrl, {
            headers: {
                "User-Agent": req.headers["user-agent"],
                "Origin": req.headers.origin
            }
        });

        const wsClientConnected = new Promise((resolve) => {
            wsClient.on("open", () => {
                console.log("connected");
                resolve(wsClient);
            });
        });

        ws.on("message", (msg) => {
            wsClientSend(msg);
        });

        ws.on("close", () => {
           wsClient.close();
        });

        function wsClientSend(msg) {
            wsClientConnected.then((client) => {
                console.log("[WS] -> ", msg);
                client.send(msg);
            });
        }

        wsClient.on("error", (err) => console.error(err));

        wsClient.on("open", () => {
            console.log("connected");

            ws.on("message", (msg) => {
                wsClient.send(msg);
            });
        });

        wsClient.on("message", (msg) => {
            console.log("[WS] <- ", msg);
            if(ws.connected) {
                ws.send(msg);
            }
        });
    });
}

module.exports = wsProxy;