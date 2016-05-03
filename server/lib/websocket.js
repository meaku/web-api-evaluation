"use strict";

const WebSocketServer = require("ws").Server;

module.exports = function init(server, resources) {
    const wss = new WebSocketServer({ server: server });

    wss.on("connection", function connection(ws) {
        function send(data) {
            ws.send(JSON.stringify(data));
        }

        ws.on("message", function incoming(message) {
            message = JSON.parse(message);
            
            //const type = message.type;
            const requestId = message.requestId;
            const url = message.payload.url;

            const parts = url.split("/");
            const type = parts[0];
            const id = parts[1];

            if (!resources[type]) {
                send({ error: "resource not found" });
                return;
            }

            const resource = resources[type];

            if (!id) {
                resource.readCollection()
                    .then(send)
                    .catch((err) => console.error(err));

                return;
            }

            resource.read(id)
                .then((payload) => {
                    send({
                        requestId,
                        payload
                    })
                })
                .catch((err) => console.error(err));
        });
    });
};

