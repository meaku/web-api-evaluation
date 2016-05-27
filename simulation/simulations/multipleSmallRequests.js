"use strict";

const { hosts } = require("../common.config.js");
const { addNetworkingVariations, saveResults } = require("../helpers");
const { chartTemplates } = require("../../helpers");
const sortBy = require("sort-by");

const runSimulation = require("../simulation");

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

    chartTemplates.transportDuration("Multiple Small Requests",  __dirname + "/Multiple-Small.pdf", results);
}

function run() {
    runSimulation(conditions, runner)
        .then((res) => {
            saveResults("multipleSmallRequests", res);

            analyze(res);
        });
}

run();

