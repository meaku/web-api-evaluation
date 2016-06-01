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
    let requests = [];

    for (let i = 1; i <= 60; i++) {
        const resource = `planets/${i}`;
        requests.push(
            new Promise((resolve) => {

                performance.mark(`fetchStart-${resource}`);

                resolve(
                    fetch(resource)
                        .then((res) => {
                            performance.mark(`fetchEnd-${resource}`);
                            performance.measure(`planets/${i}`, `fetchStart-${resource}`, `fetchEnd-${resource}`);
                            return res;
                        })
                );
            })
        );
    }

    return Promise.all(requests);
}

function loadPlanetsSharded(fetch) {
    let i = 0;
    let urls = [];
    let requests = [];
    const hostname = window.location.hostname;

    if (window.location.host.indexOf("3002") !== -1) {
        urls = [
            `https://${hostname}:3002`,
            `https://${hostname}:3022`
        ];
    }
    else {
        urls = [
            `https://${hostname}:3001`,
            `https://${hostname}:3011`
        ]
    }

    for (let i = 1; i <= 60; i++) {
        requests.push(`${urls[i % 2]}/planets/${i}`);
    }

    return Promise.all(
        requests.map(r => {
            console.log(r);

            return new Promise((resolve) => {
                performance.mark(`fetchStart-${r}`);

                resolve(
                    fetch(r)
                        .then((res) => {
                            performance.mark(`fetchEnd-${r}`);
                            performance.measure(`planets/${i}`, `fetchStart-${r}`, `fetchEnd-${r}`);
                            return res;
                        })
                );

            })
        })
    );
}

function bench(testSet) {
    performance.mark("overall-start");

    return testSet()
        .then(() => {
            performance.mark("overall-end");
            performance.measure("overall", "overall-start", "overall-end");
            performance.measure("overall-from-start", "navigationStart", "overall-end");

            const measures = window.performance.getEntriesByType("measure");

            console.table(measures);

            window.benchDone = true;
            document.body.style.background = "green";

            const requests = window.performance.getEntriesByType("marks").filter((e) => e.name.indexOf("fetch") !== -1);

            console.table(requests);

            return {
                measures: measures,
                duration: measures.find(m => m.name === "overall").duration,
                durationFromStart: measures.find(m => m.name === "overall-from-start").duration,
                resources: window.performance.getEntriesByType("resource")
            };
        })
        .catch((err) => console.error(err, err.stack));
}


function loadPlanetsSingleRequest(fetch) {
    return fetch("/planets");
}

const fetchJSON = (url) => {
    return fetch(url)
        .then(res => res.json());
};

function start(transport, type) {
    type = type || "chunks";
    let benchInstance;

    function forType(type, fetch) {
        if (type === "chunks") {
            return loadPlanets(fetch);
        }
        else if (type === "sharded") {
            return loadPlanetsSharded(fetch);
        }
        else {
            return loadPlanetsSingleRequest(fetch);
        }
    }

    if (transport.toLowerCase() === "websocket") {
        const ws = new WS(`wss://${window.location.hostname}:${window.location.port}`);
        benchInstance = ws.connected.then(() => {
            return bench(() => forType(type, ws.fetch.bind(ws)));
        });
    }
    else {
        benchInstance = bench(() => forType(type, fetchJSON))
    }

    return benchInstance;
}


window.start = start;

