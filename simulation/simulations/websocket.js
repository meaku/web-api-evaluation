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
            url: "https://192.168.99.100:3001",
            sniffPort: 3011
        }
    ]
};

addVariation(conditions, "pattern", ["ws"]);
addVariation(conditions, "latency", [20, 160, 320, 640]);
addVariation(conditions, "realtimeInterval", [1000, 5000, 10000]);

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
        .then(() => analyzer.plotMeanPublishTime("HTTP/1.1"))
        .catch((err) => console.error(err.message, err.stack));
}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner,
    script
};