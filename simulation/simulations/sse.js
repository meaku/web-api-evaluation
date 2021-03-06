"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/sse`;
const script = loadScript("realtime");

const conditions = {
    "transports": [
        {
            transport: "HTTP/2",
            url: "https://simulation-server:3002",
            baseUrl: hosts.h2,
            sniffPort: 3022
        },
        {
            transport: "HTTP/1.1",
            baseUrl: hosts.h1,
            url: "https://simulation-server:3001",
            sniffPort: 3011
        }
    ]
};


//const publishIntervals = [1000, 5000, 10000];
const publishIntervals = [1000];
addVariation(conditions, "pattern", ["sse"]);
addVariation(conditions, "latency", [20, 640]);
//addVariation(conditions, "latency", [640]);
addVariation(conditions, "realtimeInterval", publishIntervals);

function clientScript(config, callback) {
    start(config)
        .then(res => callback(res))
        .catch((err) => callback({ error: err.message, stack: err.stack }));

    setTimeout(() => callback(), 0);
}

function runner(driver, config) {
    return driver.executeAsyncScript(clientScript, config);
}

function analyze(results) {
    const analyzer = new Analyzer("results_sse", resultDir);

    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() => {
            return Promise.all(publishIntervals.map(interval => analyzer.plotMeanPublishTime(interval)))
        })
        .then(() => analyzer.plotRTTraffic())
        .then(() => {
            return Promise.all([analyzer.plotUniqueItemsXPublishInterval(20), analyzer.plotUniqueItemsXPublishInterval(640)])
        })
        .catch((err) => console.error(err.message, err.stack));
}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner,
    script
};