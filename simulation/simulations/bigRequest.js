"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations } = require("../helpers");
const { chartTemplates, LatexTable } = require("../../helpers");

const runSimulation = require("../simulation");

const resultDir = `${resultsDir}/big-request`;

const conditions = {
    "transports": [
        {
            transport: "HTTP/1",
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
    performance.mark(`bigFile-start`);

    return fetch("/file/big.json")
        .then(res => {
            //Only the stream is readable!
            performance.mark("bigFile-received");
            return res.json()
        })
        .then(() => {
            performance.mark("bigFile-decoded");
            performance.mark("bigFile-end");

            const marks = window.performance.getEntries().filter((entry) => entry.entryType === "mark");

            window.benchDone = true;
            document.body.style.background = "green";

            callback({
                duration: marks[marks.length - 1].startTime - marks[0].startTime
            });
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
            return result;
        });


    const tbl = new LatexTable({
        head: ["Transport", "Network", "Duration", "Number of packets", "Data size", "Average packet size"],
        caption: "TCP Traffic: Big request",
        label: "tcp-traffic-big-request"
    });

    results.forEach((r) => {
        tbl.push([r.transport, r.duration, r.network,  r.pcap.numberOfPackets, r.pcap.dataSize, r.pcap.averagePacketSize]);
        console.log(`${r.transport}  ${r.network} ${r.duration} ${r.pcap.numberOfPackets} ${r.pcap.dataSize} ${r.pcap.averagePacketSize} ${r.pcap.captureDuration}`)
    });

    //console.log(tbl.toLatex());
    chartTemplates.transportDuration("Big File", `${resultDir}/duration.pdf`, results);
}

function run() {
    runSimulation(conditions, runner, resultDir)
        .then((res) => {
            analyze(res);
        });
}

run();

