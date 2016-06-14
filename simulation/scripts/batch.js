"use strict";

class WS {
    constructor(url) {
        this.url = url;
        this.onMessage = [];
        return this;
    }

    connect() {
        this.ws = new WebSocket(this.url);

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

        if (!this.connected) {
            this.connect();
        }

        return this.connected
            .then(() => new Promise(resolve => {
                const requestId = resource + Date.now();

                self.onMessage[requestId.toString()] = resolve;

                self.ws.send(JSON.stringify({
                    requestId: requestId,
                    payload: {
                        method: "get",
                        url: resource
                    }
                }));
            }));
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
                throw new Error("Unexpected Response: Expected " + howMany + ", got " + res.length)
            }
            
            res.forEach(item => {
                performance.mark(`loaded-${item.id}`);
                performance.measure(`ttd-${item.id}`, "start-overall", `loaded-${item.id}`)
            });

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
        if (baseUrl) {
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
        return bench(howMany, ws.fetch.bind(ws));
    }
    else {
        return bench(howMany, fetchClient(baseUrl));
    }
}

window.start = start;