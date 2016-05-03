"use strict";

const SSE = require("sse");

module.exports = function init(server, resources) {
    const sse = new SSE(server);

    sse.on("connection", function (client) {
        setInterval(() => {
            client.send("It's " + new Date());
        }, 200);
    });
};