"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations, saveResults } = require("../helpers");
const { chartTemplates } = require("../../helpers");
const runSimulation = require("../simulation");

const resultDir = `${resultsDir}/multiple-small`;

const conditions = {
    "transports": [
        {
            transport: "h1",
            url: hosts.h1,
            sniffPort: 3001
        },
        {
            transport: "h2",
            url: hosts.h2,
            sniffPort: 3002
        },
        {
            transport: "ws",
            url: hosts.h1,
            sniffPort: 3001
        }
    ]
};

addNetworkingVariations(conditions);

function clientScript(config, callback) {
    start(config.transport).then(res => {

        //append some more data
        res.requests = window.performance.getEntries();
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
            return result;
        });

    chartTemplates.transportDuration("Multiple Small Requests", `${resultDir}/duration.pdf`, results);
}

function run() {
    runSimulation(conditions, runner, resultDir)
        .then((res) => {
            analyze(res);
        });
}

exports.run = run;
exports.analyze = analyze;

run();

