"use strict";

const fs = require("fs");
const https = require("https");
const spdy = require("spdy");
const argv = require("yargs").argv;

const websockets = require("./lib/websocket");
const sse = require("./lib/sse");

const resources = require("./lib/resources");

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
    app.http2 = true;
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

//init transportsTable 
websockets(server, resources);
sse(server, resources);