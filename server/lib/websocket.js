"use strict";

const WebSocketServer = require("ws").Server;

module.exports = function init(server, resources) {
    const wss = new WebSocketServer({
        server: server,
        perMessageDeflate: false
    });

    wss.on("connection", function connection(ws) {
        function send(data) {
            ws.send(JSON.stringify(data));
        }

        ws.on("message", function incoming(message) {
            message = JSON.parse(message);

            const requestId = message.requestId;
            let url = message.payload.url;

            //append trailing slash
            if(url.indexOf("/") === -1) {
                url += "/";
            }

            const [type, id] = url.split("/");

            if (!type || !resources[type]) {
                send({ error: "resource not found" });
                return;
            }

            const resource = resources[type];

            if (!id) {
                resource.readCollection()
                    .then((payload) => {
                        send({
                            requestId,
                            payload
                        })
                    })
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

