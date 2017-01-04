"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/websocket`;
const script = loadScript("realtime");

const conditions = {
    "transports": [
        {
            transport: "WebSocket",
            baseUrl: hosts.h1,
            url: "https://simulation-server:3001",
            sniffPort: 3011
        }
    ]
};

const publishIntervals = [1000, 5000, 10000];
addVariation(conditions, "pattern", ["ws"]);
addVariation(conditions, "latency", [20, 640]);
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
    const analyzer = new Analyzer("results_websocket", resultDir);

    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() => {
            return Promise.all(publishIntervals.map(interval => analyzer.plotMeanPublishTime(interval)));
        })
        .then(() => {
            return Promise.all([analyzer.plotUniqueItemsXPublishInterval(20), analyzer.plotUniqueItemsXPublishInterval(640)])
        })
        .then(() => analyzer.plotRTTraffic())
        .catch((err) => console.error(err.message, err.stack));
}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner,
    script
};