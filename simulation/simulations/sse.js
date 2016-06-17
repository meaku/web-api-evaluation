"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/sse`;
const script = loadScript("realtime");

const conditions = {
    "transports": [
        {
            transport: "HTTP/1.1",
            baseUrl: hosts.h1,
            url: "https://192.168.99.100:3001",
            sniffPort: 3011
        },
        {
            transport: "HTTP/2",
            url: "https://192.168.99.100:3001",
            baseUrl: hosts.h2,
            sniffPort: 3022
        }
    ]
};

addVariation(conditions, "pattern", ["sse"]);
addVariation(conditions, "latency", [20, 640]);
addVariation(conditions, "realtimeInterval", [5000, 20000]);

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
        .catch((err) => console.error(err.message, err.stack));
}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner,
    script
};