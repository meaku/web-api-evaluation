"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/polling`;
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

const pollingIntervals = [1000, 5000, 10000, 30000];
const publishIntervals = [1000, 5000, 10000];
addVariation(conditions, "pattern", ["polling"]);
addVariation(conditions, "latency", [20, 640]);
addVariation(conditions, "pollingInterval", pollingIntervals);
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
    const analyzer = new Analyzer("results_polling", resultDir);

    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() => {
            const condition = { "condition.pollingInterval": 1000 };
            return Promise.all(publishIntervals.map(interval => analyzer.plotMeanPublishTime(interval, condition)))
        })
        .then(() => {
            const condition = { "condition.pollingInterval": 10000 };
            return Promise.all(publishIntervals.map(interval => analyzer.plotMeanPublishTime(interval, condition)))
        })
        .then(() => {
            const condition = { "condition.pollingInterval": 30000 };
            return Promise.all(publishIntervals.map(interval => analyzer.plotMeanPublishTime(interval, condition)))
        })
        .then(() => {
            const condition = { "condition.pollingInterval": 30000 };
            return Promise.all(publishIntervals.map(interval => analyzer.plotUniqueItems(interval, condition)))
        })
        .then(() => {
            const condition = { "condition.pollingInterval": 1000 };
            return Promise.all([analyzer.plotUniqueItemsXPublishInterval(20, condition), analyzer.plotUniqueItemsXPublishInterval(640, condition)])
        })
        .then(() => {
            const condition = { "condition.pollingInterval": 10000 };
            return Promise.all([analyzer.plotUniqueItemsXPublishInterval(20, condition), analyzer.plotUniqueItemsXPublishInterval(640, condition)])
        })
        .then(() => {
            const condition = { "condition.pollingInterval": 30000 };
            return Promise.all([analyzer.plotUniqueItemsXPublishInterval(20, condition), analyzer.plotUniqueItemsXPublishInterval(640, condition)])
        })
        .then(() => Promise.all(pollingIntervals.map(analyzer.plotRTTraffic.bind(analyzer))))
        .then(() => Promise.all([analyzer.tablePollingDurations("HTTP/1.1"), analyzer.tablePollingDurations("HTTP/2")]))
        .then(() => Promise.all(pollingIntervals.map(analyzer.plotRTTraffic.bind(analyzer))))
        .then(() => analyzer.query({ transport: "HTTP/1.1"}, { "condition.latency": 1, "condition.realtimeInterval": 1, "condition.pollingInterval": 1}))
        .then(results => {
            results.forEach(result => {
                console.log(result.transport, result.latency, result.pollingInterval, result.realtimeInterval, "    ", result.durations.length, "    ", result.dataSize, "      ", result.durations.map(d => d.duration).join(";"));
            })
        })
        .then(() => analyzer.query({ transport: "HTTP/2"}, { "condition.latency": 1, "condition.realtimeInterval": 1, "condition.pollingInterval": 1}))
        .then(results => {
            results.forEach(result => {
                console.log(result.transport, result.latency, result.pollingInterval, result.realtimeInterval, "    ", result.durations.length, "    ", result.dataSize, "      ", result.durations.map(d => d.duration).join(";"));
            })
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