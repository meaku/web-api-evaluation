"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations, addVariation, loadScript, analyzer } = require("../helpers");
const { LatexTable, chartTemplates } = require("../../helpers");

const resultDir = `${resultsDir}/planets-fetch-2`;
const script = loadScript("fetch2");

const conditions = {
    "transports": [
        {
            transport: "HTTP/1.1",
            baseUrl: hosts.h1,
            browser: "firefox",
            latency: 80,
            url: "https://192.168.99.100:3001",
            sniffPort: 3011
        },
        {
            transport: "HTTP/2",
            url: "https://192.168.99.100:3001",
            browser: "firefox",
            latency: 80,
            baseUrl: hosts.h2,
            sniffPort: 3022
        },
        {
            transport: "WebSocket",
            url: "https://192.168.99.100:3001",
            browser: "firefox",
            baseUrl: hosts.h1,
            latency: 80,
            sniffPort: 3011
        }
    ]
};

//addVariation(conditions, "howMany", [10, 20]);
addVariation(conditions, "howMany", [2, 4, 6, 8, 10]);
//addVariation(conditions, "latency", [20, 40, 80, 160, 320, 640]);

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

    results = results.transports
        .map(result => {
            result.duration = result.result.duration;
            result.durationFromStart = result.result.durationFromStart;
            console.log(result.condition.transport, result.condition.network, result.condition.howMany, result.result.duration, result.result.requests.length, result.result.measures.length);
            return Object.assign(result, result.result);
            //return result;

            //console.log(result.result.requests.filter(r => r.type === "measure").map((r) =>
            // JSON.stringify(r)).join(","));

        });


    //analyzer.duration(results, resultDir, "TCP Traffic: Planets Chunked Requests", "tcp-planets-chunked-requests", "Planets Fetch Multiple");
    //analyzer.requestDistribution(results, resultDir);
    //analyzer.trafficSize(results, resultDir + "/traffic-size.pdf", "TCP Traffic Size");

}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner,
    script
};