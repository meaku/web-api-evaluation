"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/stream`;
const script = loadScript("stream");

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

addVariation(conditions, "howMany", [20, 40, 60, 80, 100]);
addVariation(conditions, "latency", [20, 40, 80, 160, 320, 640]);

function clientScript(config, callback) {
    start(config)
        .then(res => {
            res.requests = window.performance.getEntriesByType("resource");
            res.measures = window.performance.getEntriesByType("measure");
            res.marks = window.performance.getEntriesByType("mark");
            res.timing = window.performance.timing;
            callback(res);
        })
        .catch((err) => callback({ error: err.message, stack: err.stack }));
}

function runner(driver, config) {
    return driver.executeAsyncScript(clientScript, config);
}

function analyze(results) {
    const analyzer = new Analyzer("results_stream", resultDir);

    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() => analyzer.plotDistribution({}))
        .then(() => analyzer.plotTTFI({ yMax: 3000 }))
        .then(() => {
            return Promise.all([
                analyzer.plotDurations({ yMax: 4000 }),
                analyzer.plotTraffic(),
                analyzer.plotDurationPerTransport({})
            ]);
        })
        .then(() => {
            return Promise.all([
                analyzer.tableDurations(),
                analyzer.tableTrafficData()
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