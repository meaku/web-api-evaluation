"use strict";

const { hosts } = require("../common.config.js");
const { addNetworkingVariations, saveResults } = require("../helpers");
const sortBy = require("sort-by");

const runSimulation = require("../simulation");

const conditions = {
    "transports": [
        {
            transport: "h1",
            url: hosts.h1
        },
        {
            transport: "h2",
            url: hosts.h2
        },
        {
            transport: "ws",
            url: hosts.h1
        }
    ]
};

addNetworkingVariations(conditions);


function clientScript(config, callback) {
    performance.mark(`bigFile-start`);

    return fetch("/file/big.json")
        .then(res => {
            //Only the stream is readable!
            performance.mark("bigFile-received");
            return res.json()
        })
        .then(() => {
            performance.mark("bigFile-decoded");
            performance.mark("bigFile-end");

            const marks = window.performance.getEntries().filter((entry) => entry.entryType === "mark");
            console.table(marks);

            window.benchDone = true;
            document.body.style.background = "green";

            callback({
                duration: marks[marks.length - 1].startTime - marks[0].startTime
            });
        })
}

function runner(driver, config) {
    if (!config) {
        return Promise.reject(new Error("Missing config"));
    }

    driver.get(config.url);
    driver.manage().timeouts().setScriptTimeout(100000);
    return driver.executeAsyncScript(clientScript, config);
}

function analyze(res) {
    let results = res.transports;

    results = results
        .map(result => {
            result.connectionName = result.condition.connectionName;
            result.transport = result.condition.transport;
            return result;
        })
        .sort(sortBy("connectionName", "transport"));

    results.forEach(transport => {
        console.log(transport.connectionName, transport.condition.transport, transport.result.duration);
    });
}

function run() {
    runSimulation(conditions, runner)
        .then((res) => {
            saveResults("bigRequest", res);

            analyze(res);
        });
}

run();

