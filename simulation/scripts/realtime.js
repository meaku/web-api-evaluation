"use strict";

function streamedPollingFetch() {
    return fetch("/streamed-polling").then(response => {
        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let buffer = "";

        const items = [];

        function addItem(str) {
            let item = JSON.parse(str);
            console.log("streamedPolling", item);
            items.push(item);
        }

        function processJSON(result) {
            if (result.done) {
                // no more data, but there might be a JSON object left in the buffer
                if (buffer.trim()) {
                    addItem(buffer);
                }
                return items;
            }

            buffer += decoder.decode(result.value, { stream: true });

            while (true) {
                const indexOfNewline = buffer.indexOf("\n");
                if (indexOfNewline == -1) {
                    break;
                }

                addItem(buffer.slice(0, indexOfNewline));

                buffer = buffer.slice(indexOfNewline + 1);
            }

            return reader
                .read()
                .then(processJSON);
        }

        return reader
            .read()
            .then(processJSON);
    });
}

function polling(interval = 10000) {
    setInterval(() => {
        fetch("/polling")
            .then(r => r.json())
            .then((data) => {
                console.log("polling", data.id, data);
                if (data.id) {
                    console.log("polling", data.id);
                }
            });
    }, interval);
}

function longPolling() {

    function doPoll() {
        return fetch("/long-polling")
            .then(r => r.json())
            .then((data) => {
                console.log("longPolling", data);
                return doPoll();
            });
    }

    return doPoll();
}

function ws() {
    const ws = new WebSocket("wss://localhost:3002");

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("ws", data);
    };
}

window.sse = function () {
    var es = new EventSource("/sse");

    es.onopen = function () {
        console.log("sse connection to /see established");
    };

    es.onerror = function (err) {
        console.error("An error occurred: " + err.message);
    };

    es.onmessage = function (event) {
        const data = JSON.parse(event.data);
        console.log("sse", data);
    };
};

sse();
longPolling();
polling();
ws();
streamedPollingFetch();
