"use strict";

const { hosts, resultsDir } = require("../common.config.js");
const { addNetworkingVariations,  } = require("../helpers");
const { LatexTable, chartTemplates } = require("../../helpers");
const runSimulation = require("../simulation");
const resultDir = `${resultsDir}/planets-fetch`;
const fs = require("fs");
const path = require("path");

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

//addNetworkingVariations(conditions);

const script = fs.readFileSync(path.resolve(__dirname, "../test.js")).toString("utf-8");


function clientScript(config, callback) {
   start({}).then(r => {
       callback({
           measures: window.performance.getEntriesByType("measure")
       });
   });
}

function runner(driver, config) {
    if (!config) {
        return Promise.reject(new Error("Missing config"));
    }

    driver.get(config.url);
    driver.manage().timeouts().setScriptTimeout(100000);
    driver.executeScript(script);
    return driver.executeAsyncScript(clientScript, config);
}

function analyze(res) {
   //console.log(

       res.transports.forEach((result) => {
           console.log(result.result.measures);
       })
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

