"use strict";

const fs = require("fs");
const https = require("https");
const spdy = require("spdy");
const argv = require("yargs").argv;

const websockets = require("./lib/websocket");
const sse = require("./lib/sse");

const resources = require("./lib/resources");
const EventStream = require("./lib/EventStream");

const app = require("./app");
const es = new EventStream();

app.es = es;

let server;

const httpVersion = argv.httpVersion || "http2";
const port = argv.port || 3002;

const options = {
    key: fs.readFileSync(__dirname + "/cert/localhost.key"),
    cert: fs.readFileSync(__dirname + "/cert/localhost.crt"),
    spdy: {
        protocols: ["h2"]
    }
};

//http version
if (httpVersion === "http2") {
    app.http2 = true;
    server = spdy.createServer(options, app);
}
else {
    server = https.createServer(options, app)
}

server.listen(parseInt(port), () => {
    console.log(`[${httpVersion}] Server listening at  ${port}`)
});

let connections = 0;
server.setTimeout(1000 * 60 * 10);
server.on("connection", () => console.log("connections: " + ++connections));

//init transportsTable 
websockets(server, resources, es);
sse(server, resources, es);