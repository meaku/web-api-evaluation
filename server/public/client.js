"use strict";

const performance = window.performance;

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
        console.log("fetch", resource);
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

function loadPlanets(fetch) {
    console.log("loadPlanets", fetch);
    let requests = [];

    for (let i = 1; i <= 60; i++) {
        requests.push(
            new Promise((resolve) => {

                performance.mark(`fetchStart-planets/${i}`);

                resolve(
                    fetch(`planets/${i}`)
                        .then((res) => {
                            performance.mark(`fetchEnd-planets/${i}`);
                            return res;
                        })
                );

            })
        );
    }

    return Promise.all(requests);
}

function bench(testSet) {
    performance.mark("overall-start");

    testSet()
        .then(() => {
            performance.mark("overall-end");

            const marks = window.performance.getEntries().filter((entry) => entry.entryType === "mark");

            console.table(marks);

            performance.measure("overall", "overall-start", "overall-end");
            console.log("done: ", marks[marks.length - 1].startTime - marks[0].startTime);
            window.benchDone = true;
            document.body.style.background = "green";
        })
        .catch((err) => console.error(err, err.stack));
}


window.start = function (type) {

    let benchInstance;

    if (type === "ws") {
        const ws = new WS("wss://localhost:3002");
        benchInstance = ws.connected.then(() => {
            return bench(() => loadPlanets(ws.fetch.bind(ws)));
        });
    }
    else {
        benchInstance = bench(() => loadPlanets((url) => {
            return fetch(url)
                .then((res) => res.json());
        }))
    }

    benchInstance.then(() => console.log("done"));
};




