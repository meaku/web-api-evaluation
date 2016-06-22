"use strict";

const webdriver = require("selenium-webdriver");
const webPush = require("web-push");

if(process.env.GCM_API_KEY) {
    throw new Error("You have to provide an GCM_API_KEY");
}

webPush.setGCMAPIKey(process.env.GCM_API_KEY);

const item = {
    "name": "6mWejg2XbEjxI203R4LB",
    "id": 1,
    "rotation_period": "59503",
    "orbital_period": "2874",
    "diameter": "542094",
    "climate": "wXSAuh44FzLdqfeqtYbXxlnObD7GVl",
    "gravity": "r6YJl60gM6VYn8RpDOIbKqNU3AuR",
    "terrain": "zgxkAKV4",
    "surface_water": "59127",
    "population": "534732496349",
    "created": "2014-10-15T02:55:48.040Z",
    "edited": "2016-03-29T13:00:25.185Z",
    "url": "cIzgUsoTHqPvBO76vYC1",
    "description": "opDSkVlWcUkjD1gGIRVGcoUiHauZfwsTvIGJ6pCiOVids0wPjv7iq2SZxchYIYQ4hIVxkyEm1uX5Ht83z1wDT6FohHWI6WmyT81J",
    "longText": "5N61F32SjhceGwD2uT3bsDaVapXhtDOt8oJncBuglhAbUQsYzW2NX5dDwBuOQJr0oY1oRoe8GqtAIBdQuWPgKif7l4HfgH9Y2Wb58Pwe0o2tcvgNQlIEyOBBiXdcU1zYVLt1nsRW9FuVvDQoLnrS3KO0mRMjhhla1Bygn59nUIHs0Y47QM5tScQEQf7xuLuo8C4vYFZX",
    "films": [
        "dGVw10mUJf",
        "QO37yh514N",
        "qQKXP0a3qv",
        "eFhvD808ji",
        "rNbqH1uaxY",
        "h5J6m9cds3",
        "PQRUF1E2TY",
        "lYBnaOhBHC",
        "eVxiemUEFO",
        "G0G1eNbGnG",
        "96uvDj5a87",
        "2APpiF16Eh",
        "tfRkR2yWKO",
        "6lhTVZQdid",
        "ZDB1udexRj",
        "6Czfcfug4W",
        "GvuGpZqJZR",
        "0xzbhqvEhG",
        "G7LxYMVsSf",
        "S4X4RSRAau"
    ],
    "residents": [
        "5cMyLK2w3m",
        "gOFmyrDJsR",
        "NnDvCGTISG",
        "I5OZjB4oQQ",
        "E03qTMxJXl",
        "EWX0ZMH9dE",
        "SogPEZ2GOH",
        "fVyHdblmDg",
        "jHt3F6ssCD",
        "FSDVIVznoI"
    ]
};

function sendPush(subscription, payload) {
    return webPush.sendNotification(subscription.endpoint, {
        userPublicKey: subscription.key,
        userAuth: subscription.auth,
        payload: JSON.stringify(payload)
    });
}

function pushInterval(subscription, interval, howMany = 10) {
    let i = 1;
    return new Promise(resolve => {

        let emitter = setInterval(() => {
            sendPush(subscription, Object.assign(
                item,
                {
                    id: i++,
                    createdAt: Date.now()
                }
            ));

            if (i === 10) {
                clearInterval(emitter);
                resolve();
            }
        }, interval);
    });
}

const { hosts, resultsDir } = require("../common.config.js");
const { addVariation, loadScript } = require("../helpers");
const Analyzer = require("../Analyzer");


const resultDir = `${resultsDir}/web-push`;
const conditions = {
    "transports": [
        {
            transport: "WebPush",
            baseUrl: hosts.h1,
            url: "https://192.168.99.100:3002/webpush.html",
            sniffPort: 3002
        }
    ]
};

addVariation(conditions, "latency", [20, 640]);
addVariation(conditions, "realtimeInterval", [1000, 10000, 30000]);

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
        .then(function (subscription) {
            subscription = JSON.parse(subscription);
            return pushInterval(subscription, config.realtimeInterval);
        })
        .then(() => {
            return {
                status: "success"
            };
        });
}

function analyze(results) {
    const analyzer = new Analyzer("results_webpush", resultDir);

    return analyzer.connect()
        .then(() => analyzer.updateResults(resultDir + "/results.json"))
        .then(() => {
            return Promise.all([analyzer.plotMeanPublishTime(1000), analyzer.plotMeanPublishTime(20000), analyzer.plotMeanPublishTime(10000), analyzer.plotMeanPublishTime(30000)])
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