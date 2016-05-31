"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations  } = require("../helpers");
const { chartTemplates, LatexTable } = require("../../helpers");
const runSimulation = require("../simulation");
const resultDir = `${resultsDir}/planets-fetch-collection`;

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
    start(config.transport, "fetch-collection").then(res => {

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


    const tbl = new LatexTable({
        head: ["Transport", "Network", "Duration", "Number of packets", "Data size", "Average packet size"],
        caption: "TCP Traffic: Planets Single Request",
        label: "tcp-planets-single-request"
    });

    results.forEach((r) => {
        tbl.push([r.transport, r.network, r.duration,  r.pcap.numberOfPackets, r.pcap.dataSize, r.pcap.averagePacketSize]);
        console.log(`${r.transport}  ${r.network} ${r.duration} ${r.pcap.numberOfPackets} ${r.pcap.dataSize} ${r.pcap.averagePacketSize} ${r.pcap.captureDuration}`)
    });

    chartTemplates.transportDuration("Planets: Single Request", `${resultDir}/duration.pdf`, results);
    chartTemplates.transportDuration("Planets: Single Request (From Start)", `${resultDir}/duration-from-start.pdf`, results.map(res => {
        res.duration = res.result.durationFromStart;
        return res;
    }));

    console.log(tbl.toLatex());
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

