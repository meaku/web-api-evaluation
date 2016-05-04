"use strict";

const WebSocketServer = require("ws").Server;
const WebSocket = require("ws");

function wsProxy(server) {
    const wss = new WebSocketServer({ server });

    wss.on("connection", function connection(wsClient) {
        const req = wsClient.upgradeReq;

        //TODO wss or ws depending on origin
        const wsUrl = "wss://" + req.headers.host + req.url;

        let wsTarget = new WebSocket(wsUrl, {
            headers: {
                "User-Agent": req.headers["user-agent"],
                "Origin": req.headers.origin
            }
        });

        const wsTargetConnection = new Promise((resolve) => {
            wsTarget.on("open", () => {
                console.log("connected: " + wsUrl);
                resolve(wsTarget);
            });
        });

        wsClient.on("message", (msg) => {
            pipeToTarget(msg);
        });

        wsClient.on("close", () => {
            console.log("Closing WS Connection");
            wsTarget.close();
        });

        function pipeToTarget(msg) {
            wsTargetConnection.then((wsClient) => {
                console.log("[WS] -> ", msg);
                wsClient.send(msg);
            });
        }

        wsTarget.on("error", (err) => console.error(err));

        wsTarget.on("message", (msg) => {
            console.log("[WS] <- ", msg);
            if(wsClient.connected) {
                wsClient.send(msg);
            }
        });
    });
}

module.exports = wsProxy;