"use strict";

const fs = require("fs");
const https = require("https");
const spdy = require("spdy");
const argv = require("yargs").argv;
const WebSocketServer = require("ws").Server;
const resources = require("./resources");

const api = require("./app");

let app;
let server;

const type = argv.type || "api";
const httpVersion = argv.httpVersion || "http2";
const port = argv.port || 3002;

const options = {
    key: fs.readFileSync(__dirname + "/cert/localhost.key"),
    cert: fs.readFileSync(__dirname + "/cert/localhost.crt"),
    spdy: {
        protocols: ["h2"],
        plain: false,
        connection: {
            windowSize: 1024 * 1024, // Server's window size

            // **optional** if true - server will send 3.1 frames on 3.0 *plain* spdy
            autoSpdy31: false
        }
    }
};

//server type
app = api;

//http version
if (httpVersion === "http2") {
    server = spdy.createServer(options, app);
}
else {
    server = https.createServer(options, app)
}

server.listen(parseInt(port), () => {
    console.log(`[${type}] [${httpVersion}] Server listening at  ${port}`)
});

let connections = 0;
server.on("connection", () => console.log("connections: " + ++connections));

const wss = new WebSocketServer({ server: server });

wss.on("connection", function connection(ws) {

    function send(data) {
        console.log("send", data);
        ws.send(JSON.stringify(data));
    }

    ws.on("message", function incoming(message) {
        message = JSON.parse(message);
        console.log('received', message);

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