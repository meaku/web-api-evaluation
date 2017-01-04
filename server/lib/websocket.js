"use strict";

const WebSocketServer = require("ws").Server;

function readCollection(resource, send) {
    resource.readCollection()
        .then(payload => send(payload))
        .catch((err) => send(err));
}

function readCollectionBatch(resource, ids, send) {
    resource.readCollectionBatch(ids)
        .then(payload => send(payload))
        .catch((err) => send(err));
}

function read(resource, id, send) {
    resource.read(id)
        .then(payload => send(payload))
        .catch((err) => send(err));
}

module.exports = function init(server, resources, es) {
    const wss = new WebSocketServer({
        server: server,
        perMessageDeflate: false
    });

    wss.on("connection", function connection(ws) {

        function pushData(data){
            ws.send(JSON.stringify(data));
        }

        ws.on("close", () => {
            console.log("connection closed");
            es.removeListener("data", pushData);
        });

        //push!
        es.on("data", pushData);

        ws.on("message", function incoming(message) {
            message = JSON.parse(message);

            const requestId = message.requestId;
            let url = message.payload.url;

            function send(payload) {
                const data = {
                    requestId,
                    payload
                };
                ws.send(JSON.stringify(data));
            }

            //append trailing slash
            if(url.indexOf("/") === -1) {
                url += "/";
            }
            
            const [type, id] = url.split("/");
            const resource = resources[type];
            
            console.log(type, id);

            if (!resource) {
                send({ error: "resource not found" });
                return;
            }

            if(!id){
                return readCollection(resource, send);
            }

            //detect range request
            if(id.indexOf("-") !== -1) {
                let [startId, endId] = id.split("-");
                const ids = [];

                startId = parseInt(startId);
                endId = parseInt(endId);

                for (startId; startId <= endId; startId++) {
                    ids.push(startId);
                }

                return readCollectionBatch(resource, ids, send);
            }

            return read(resource, id, send);
        });
    });
};

