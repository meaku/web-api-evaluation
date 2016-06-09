"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/multiple`;
const script = loadScript("multiple");

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
        },
        {
            transport: "WebSocket",
            url: "https://192.168.99.100:3001",
            baseUrl: hosts.h1,
            sniffPort: 3011
        }
    ]
};

addVariation(conditions, "howMany", [20, 40, 60, 80, 100]);
addVariation(conditions, "latency", [20, 40, 80, 160, 320, 640]);

function clientScript(config, callback) {
    start(config).then(res => {
        res.requests = window.performance.getEntriesByType("resource");
        res.measures = window.performance.getEntriesByType("measure");
        res.marks = window.performance.getEntriesByType("mark");
        res.timing = window.performance.timing;
        callback(res);
    });
}

function runner(driver, config) {
    return driver.executeAsyncScript(clientScript, config);
}

function analyze(results) {
    const analyzer = new Analyzer("results_multiple", resultDir);
    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() =>{
            return Promise.all([
                analyzer.plotDurations(),
                analyzer.plotTraffic(),
                analyzer.plotDurationPerTransport()
            ]);
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