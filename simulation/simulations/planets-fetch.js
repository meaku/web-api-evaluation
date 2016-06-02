"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations, loadScript, analyzer } = require("../helpers");
const { LatexTable, chartTemplates } = require("../../helpers");

const resultDir = `${resultsDir}/planets-fetch`;
const script = loadScript("planets");

const conditions = {
    "transports": [
        {
            transport: "HTTP/1.1",
            url: hosts.h1,
            sniffPort: 3001
        },
        {
            transport: "HTTP/2",
            url: hosts.h2,
            sniffPort: 3002
        },
        {
            transport: "WebSocket",
            url: hosts.h2,
            sniffPort: 3002
        }
    ]
};

addNetworkingVariations(conditions);

function clientScript(config, callback) {
    start(config.transport, "chunks").then(res => {
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

function analyze(res) {
    let results = res.transports;

    results = results
        .map(result => {
            result.duration = result.result.duration;
            result.durationFromStart = result.result.durationFromStart;
            return Object.assign(result, result.result);
            //return result;

            //console.log(result.result.requests.filter(r => r.type === "measure").map((r) =>
            // JSON.stringify(r)).join(","));

        });

    //analyzer.duration(results, resultDir, "TCP Traffic: Planets Chunked Requests", "tcp-planets-chunked-requests", "Planets Fetch Multiple");
    analyzer.requestDistribution(results, resultDir);
    //analyzer.trafficSize(results, resultDir + "/traffic-size.pdf", "TCP Traffic Size");

}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner,
    script
};