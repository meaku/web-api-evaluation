"use strict";

const webdriver = require("selenium-webdriver");
const fetch = require("node-fetch");
const qs = require("qs");

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");

const resultDir = `${resultsDir}/web-push`;
const conditions = {
    "transports": [
        {
            transport: "WebPush",
            baseUrl: hosts.h1,
            url: "https://simulation-server:3001/webpush.html",
            sniffPort: 3002
        }
    ]
};

addVariation(conditions, "latency", [20, 640]);
addVariation(conditions, "realtimeInterval", [1000, 5000, 10000]);

function runner(driver, config) {
    driver.manage().timeouts().setScriptTimeout(5000000);

    return driver
        .wait(function () {
            return driver.executeScript(function () {
                return typeof window.pushSubscription !== 'undefined';
            });
        })
        .then(function () {
            return driver.executeScript(() => JSON.stringify(window.pushSubscription))
        })
        .then(subscription => {
            subscription = JSON.parse(subscription);
            const [host, port] = config.baseUrl.split(":");
            const serverHost = `0.0.0.0:${port}`;
            return fetch(`https://${serverHost}/start/${config.realtimeInterval}/?${qs.stringify(subscription)}`)
                .then(res => res.json());
        })
}

function analyze(results) {
    const analyzer = new Analyzer("results_webpush", resultDir);

    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() => {
            return Promise.all([analyzer.plotMeanPublishTime(1000), analyzer.plotMeanPublishTime(5000), analyzer.plotMeanPublishTime(10000)])
        })
        .then(() => {
            return Promise.all([analyzer.plotUniqueItemsXPublishInterval(20), analyzer.plotUniqueItemsXPublishInterval(640)])
        })
        .then(() => analyzer.plotRTTraffic())
        .catch((err) => console.error(err.message, err.stack));
}

module.exports = {
    resultDir,
    analyze,
    conditions,
    runner
};