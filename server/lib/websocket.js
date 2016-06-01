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
            
            //const type = message.type;
            const requestId = message.requestId;
            const url = message.payload.url;
            let type, id;

            if(url.indexOf("/") === -1) {
                [type, id] = [url, null];
            }
            else {
                [type, id] = url.split("/");
            }

            if (!type || !resources[type]) {
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

