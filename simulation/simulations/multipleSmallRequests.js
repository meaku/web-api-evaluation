"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations,  } = require("../helpers");
const { chartTemplates } = require("../../helpers");
const runSimulation = require("../simulation");
const resultDir = `${resultsDir}/multiple-small`;

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
            result.duration = result.result.duration;
            result.durationFromStart = result.result.overallFromStart;
            return result;
        });

    
    results.forEach((r) => {
        console.log(`${r.transport}  ${r.connectionName} ${r.duration} ${r.pcap.numberOfPackets} ${r.pcap.dataSize} ${r.pcap.averagePacketSize} ${r.pcap.captureDuration}`)
    });

    chartTemplates.transportDuration("Multiple Small Requests", `${resultDir}/duration.pdf`, results);
}

function run() {
    runSimulation(conditions, runner, resultDir)
        .then((res) => {
            analyze(res);
        })
        .catch(err => console.error(err.message, err.stack));
}

exports.run = run;
exports.analyze = analyze;

run();
//analyze(require(`${resultDir}/results.json`));

