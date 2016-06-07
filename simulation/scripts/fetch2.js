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

const fetchJSON = (url) => {
    return fetch(url)
        .then(res => res.json());
};


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
    window.performance.mark("start-overall");

    return loadCollection(howMany, fetch)
        .then((res) => {
            console.log(res);
            window.performance.mark("end-overall");
            performance.measure("overall", `start-overall`, `end-overall`);

            const measures = window.performance.getEntriesByType("measure");

            return {
                duration: measures.find(r => r.name === "overall").duration
            };
        });
}


function loadCollection(howMany, fetch) {
    let requests = [];

    for (let i = 1; i <= howMany; i++) {
        requests.push(doFetch(`planets/${i}`, fetch));
    }

    return Promise.all(requests);
}

function start(transport, howMany) {

    if (transport.toLowerCase() === "websocket") {
        const ws = new WS(`wss://${window.location.hostname}:${window.location.port}`);
        return ws.connected.then(() => {
            return bench(howMany, ws.fetch.bind(ws));
        });
    }
    else {
        return bench(howMany, fetchJSON);
    }
}

window.start = start;