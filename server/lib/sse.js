"use strict";

const SSE = require("sse");

module.exports = function init(server, resources) {
    const sse = new SSE(server);
    let id = 0;

    sse.on("connection", function (client) {
        setInterval(() => {
            client.send("message", "It's " + new Date(), id++);
        }, 1000);

        setInterval(() => {
            client.send("breaking-news", "It's 5 seconds later now", id++);
        }, 5000)
    });
};