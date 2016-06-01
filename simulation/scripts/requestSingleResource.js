"use strict";

class WS {
    constructor(url) {
        this.ws = new WebSocket(url);

        this.onMessage = [];

        this.ws.onmessage = (event) => {
            event = JSON.parse(event.data);

            if (this.onMessage[event.requestId]) {
                this.onMessage[event.requestId](event.payload);
            }
        };

        this.connected = new Promise((resolve) => {
            const self = this;

            this.ws.onopen = function () {
                resolve(self);
            }
        });

        return this;
    }

    fetch(resource) {
        const self = this;
        return new Promise((resolve) => {
            const requestId = resource + Date.now();

            self.onMessage[requestId.toString()] = function (res) {
                console.log("resilbe", res);
                resolve(res);
            };

            self.ws.send(JSON.stringify({
                requestId: requestId,
                payload: {
                    method: "get",
                    url: resource
                }
            }));
        });
    }
}

const fetchJSON = (url) => {
    return fetch(url)
        .then(res => res.json());
};

function bench(fetch, resource) {
    performance.mark(`start-${resource}`);
    return fetch(resource)
        .then(() => {
            performance.mark(`end-${resource}`);
            performance.measure(resource, `start-${resource}`, `end-${resource}`);

            const measures = window.performance.getEntriesByType("measure");

            return {
                duration: measures[0].duration
            };
        });
}

function start(transport, resource) {
    let benchInstance;

    if (transport.toLowerCase() === "websocket") {
        const ws = new WS(`wss://${window.location.hostname}:${window.location.port}`);
        benchInstance = ws.connected.then(() => {
            return bench(ws.fetch.bind(ws), resource);
        });
    }
    else {
        benchInstance = bench(fetchJSON, resource)
    }

    return benchInstance;
}

window.start = start;