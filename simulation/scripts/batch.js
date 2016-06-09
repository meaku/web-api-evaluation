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

function doFetch(resource, fn) {
    performance.mark(`start-${resource}`);
    return fn(resource)
        .then((res) => {
            performance.mark(`end-${resource}`);
            performance.measure(resource, `start-${resource}`, `end-${resource}`);
            return res;
        });
}

function bench(howMany, fetch) {
    performance.mark("start-overall");

    return doFetch(`items/1-${howMany}`, fetch)
        .then(res => {
            if(res.length !== howMany) {
                throw new Error("Unexpected Data Length");
            }

            performance.mark("end-overall");
            performance.measure("overall", `start-overall`, `end-overall`);
            const measures = performance.getEntriesByType("measure");

            return {
                duration: measures.find(r => r.name === "overall").duration
            };
        });
}

function fetchClient(baseUrl) {
    return (resource) => {
        if(baseUrl) {
            resource = `https://${baseUrl}/${resource}`;
        }

        return fetch(resource)
            .then(res => res.json());
    };
}

function start(config) {
    const { baseUrl, transport, howMany } = config;
    const [host, port]= baseUrl.split(":");

    if (transport.toLowerCase() === "websocket") {
        const ws = new WS(`wss://${host}:${port}`);
        return ws.connected.then(() => {
            return bench(howMany, ws.fetch.bind(ws));
        });
    }
    else {
        return bench(howMany, fetchClient(baseUrl));
    }
}

window.start = start;