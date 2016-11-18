"use strict";

const performance = window.performance;

function streamedPolling(baseUrl, onItem) {
    return fetch("https://" + baseUrl + "/streamed-polling")
        .then(response => {
            const decoder = new TextDecoder();
            const reader = response.body.getReader();
            let buffer = "";

            const items = [];

            function addItem(str) {
                let item = JSON.parse(str);
                onItem(item);
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

function polling(baseUrl, onItem, interval = 10000) {
    return new Promise(resolve => {
        const int = setInterval(() => {
            fetch("https://" + baseUrl + "/polling")
                .then(r => r.json())
                .then((data) => {
                    if (data.id) {
                        onItem(data);
                    }

                    if (data.id === 10) {
                        clearInterval(int);
                        resolve();
                    }
                });
        }, interval);
    });
}

function longPolling(baseUrl, onItem) {
    function doPoll() {
        return fetch("https://" + baseUrl + "/long-polling")
            .then(r => r.json())
            .then((data) => {
                onItem(data);
                if (data.id === 10) {
                    return;
                }

                return doPoll();
            });
    }

    return doPoll();
}

function ws(baseUrl, onItem) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket("wss://" + baseUrl);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onItem(data);

            if (data.id === 10) {
                resolve();
            }
        };

        ws.onerror = reject;
    });
}

function sock(baseUrl, onItem) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket("wss://" + baseUrl);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onItem(data);

            if (data.id === 10) {
                resolve();
            }
        };

        ws.onerror = reject;
    });
}

function sse(baseUrl, onItem) {
    return new Promise((resolve, reject) => {
        var es = new EventSource("https://" + baseUrl + "/sse");
        const items = [];

        es.onerror = function (err) {
            reject(err);
        };

        es.onmessage = function (event) {
            const data = JSON.parse(event.data);
            items.push(data);
            onItem(data);

            if (data.id === 10) {
                resolve(items);
            }
        };
    });
}

const patterns = {
    sse,
    polling,
    streamedPolling,
    longPolling,
    ws
};

function start(config) {
    const pattern = config.pattern || "sse";
    let requestedAt = Date.now();

    window.results = {
        durations: []
    };

    performance.mark("start-overall");

    function onItem(item) {
        let received = Date.now();
        console.log(`${pattern} - ${item.id} ${Date.now() - item.createdAt}`);
        performance.mark(`received-${item.id}`);
        performance.measure(`since-start-${item.id}`, "start-overall", `received-${item.id}`);
        
        window.results.durations.push({
            id: item.id,
            createdAt: item.createdAt,
            requestedAt,
            durationClient: received - requestedAt,
            received,
            duration: received - item.createdAt
        });

        requestedAt = Date.now();
    }

    return patterns[pattern](config.baseUrl || window.location.host, onItem, config.pollingInterval)
        .then(() => {
            return { durations: performance.getEntriesByType("measure") }
        })
        .catch((err) => window.results.error = err);
}

window.start = start;
