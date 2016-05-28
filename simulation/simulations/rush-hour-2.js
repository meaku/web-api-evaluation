"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations } = require("../helpers");
const { chartTemplates, requestDurationDistribution } = require("../../helpers");
const runSimulation = require("../simulation");
const fs = require("fs");

const resultDir = `${resultsDir}/rush-hour-2`;

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
    fetch("/delay/10000?blab=2");
    fetch("/delay/10000?blib=1");

    start(config.transport)
        .then(res => {
            //append some more data
            res.marks = window.performance.getEntriesByType("mark");
            res.requests = window.performance.getEntriesByType("measure");
            res.timing = window.performance.timing;

            callback(res);
        });
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
            result.duration = result.result.duration;
            result.requests = result.result.requests;

            return result;
        });

    ///*
    results.filter(r => r.connectionName === "2G" || r.connectionName === "Fibre").forEach(r => {
        const dist = requestDurationDistribution(r.requests, 6);
        chartTemplates.requestDurationDistribution(
            "Request Distribution: 2G "+ r.transport,
            `${resultDir}/distribution_2G_${r.transport}.pdf`,
            dist.map(d => d.name),
            dist.map(d => d.count)
        );
    });
    //*/

    /*
    results.filter(r => r.transport === "h1" || r.transport === "h2").forEach(r => {
        const { requests, timings } = requestDurations(r.requests);
        chartTemplates.requestTimeline(`Request Timeline: ${r.transport}  ${r.connectionName}`, `${resultDir}/timeline.pdf`, requests, timings);
    });
    */

    chartTemplates.transportDuration("Rush Hour (2 Lanes blocked)", `${resultDir}/duration.pdf`, results);
}

function run() {
    runSimulation(conditions, runner, resultDir)
        .then((res) => {
            analyze(res);
        });
}

run();
//analyze(require(resultDir + "/results.json"));
