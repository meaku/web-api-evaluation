"use strict";

const SSE = require("sse");

module.exports = function init(server, resources, es) {
    const sse = new SSE(server);
    
    sse.on("connection", function (client) {
        es.on("data", (data) => client.send(JSON.stringify(data)));
    });
};