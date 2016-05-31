"use strict";

const performance = window.performance;

function conjestLane(duration) {
    return fetch(`/delay/${duration}`);
}

function rushHour(lanes, duration) {
    const promises = [];

    for (let i = 0; i <= lanes; i++) {
        promises.push(conjestLane(duration));
    }

    return fetch(`/planets/1`)
        .then(() => console.log("done"));
}

function streamedFetch() {
    function consume(reader) {
        var total = 0;
        return pump();

        function pump() {
            return reader
                .read()
                .then(({ done, value }) => {
                    if (done) {
                        return
                    }

                    total += value.byteLength;
                    console.log(`received ${value.byteLength} bytes (${total} bytes in total)`);
                    return pump();
                })
        }
    }

    fetch("/planets")
        .then(res => consume(res.body.getReader()))
        .then(() => console.log("done"))
        .catch(e => console.error(e));
}

window.streamedFetch = streamedFetch;

function streamedPollingFetch() {
    function consume(reader) {
        var total = 0;
        return pump();

        function pump() {
            return reader
                .read()
                .then(({ done, value }) => {
                    if (done) {
                        return
                    }

                    total += value.byteLength;
                    console.log(`received ${value.byteLength} bytes (${total} bytes in total)`);
                    return pump();
                })
        }
    }

    fetch("/streamed-polling")
        .then(res => consume(res.body.getReader()))
        .then(() => console.log("done"))
        .catch(e => console.error(e));
}

window.streamedPollingFetch = streamedPollingFetch;

function streamedPolling() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/streamed-polling");
    xhr.seenBytes = 0;

    xhr.onreadystatechange = function () {
        console.log(xhr.readyState);
        if (xhr.readyState > 2) {
            var newData = xhr.responseText.substr(xhr.seenBytes);
            // process newData
            console.log("newData", newData);

            xhr.seenBytes = xhr.responseText.length;
        }
    };

    xhr.onloadend = function () {
        console.log("done");
        //finished
    };


    xhr.send();
}

window.streamedPolling = streamedPolling;

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
    let requests = [];

    for (let i = 1; i <= 60; i++) {
        requests.push(
            new Promise((resolve) => {

                performance.mark(`fetchStart-planets/${i}`);

                resolve(
                    fetch(`planets/${i}`)
                        .then((res) => {
                            performance.mark(`fetchEnd-planets/${i}`);
                            performance.measure(`planets/${i}`, `fetchStart-planets/${i}`, `fetchEnd-planets/${i}`);
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

    if(window.location.host.indexOf("3002") !== -1) {
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

window.sse = function () {
    var es = new EventSource("/sse");

    es.onopen = function () {
        console.log("sse connection to /see established");
    };

    es.onerror = function (err) {
        console.error("An error occurred: " + err.message);
    };

    es.onmessage = function (event) {
        console.log(event.data);
    };

    //listen for messages with type === "important-news"
    es.addEventListener("breaking-news", function (event) {
        console.log("Breaking News: ", event.data);
    });
};


function loadPlanetsSingleRequest(fetch) {
    return fetch("/planets");
}

const fetchJSON = (url) => {
    return fetch(url)
        .then(res => res.json());
};

window.start = function (transport, type) {
    type = type || "chunks";
    let benchInstance;

    function forType(type, fetch) {
        if (type === "chunks") {
            return loadPlanets(fetch);
        }
        else if(type === "sharded") {
            return loadPlanetsSharded(fetch);
        }
        else {
            return loadPlanetsSingleRequest(fetch);
        }
    }

    if (transport === "WebSocket") {
        const ws = new WS(`wss://${window.location.hostname}:${window.location.port}`);
        benchInstance = ws.connected.then(() => {
            return bench(() => forType(type, ws.fetch.bind(ws)));
        });
    }
    else {
        benchInstance = bench(() => forType(type, fetchJSON))
    }

    return benchInstance;
};

