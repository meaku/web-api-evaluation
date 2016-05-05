"use strict";

const fs = require("fs");
const path = require("path");

var webdriver = require("selenium-webdriver"),
    chrome = require("selenium-webdriver/chrome");

const initProxy = require("../proxy/proxy");

//const websites = require("../data/top100Wikipedia.json").map((website) => website.domain);

///*
const websites = [
    "nytimes.com",
    "twitter.com",
    "soundcloud.com",
    "github.com",
    "facebook.com",
    "youtube.com",
    "instagram.com",
    "web.whatsapp.com",
    "play.spotify.com",
    "stackoverflow.com"
];
//*/

function runTest(domain) {
    const proxy = initProxy({
        domain,
        port: 8080
    });

    let findings = {};

    return proxy.start()
        .then(() => {

            var driver = new webdriver.Builder()
                .forBrowser("chrome")
                .setChromeOptions(
                    new chrome.Options().setProxy({
                        proxyType: "manual",
                        httpProxy: "localhost:8080",
                        sslProxy: "localhost:8080"
                    })
                )
                .build();

            return load(driver, domain);
        })
        .then((browserFindings) => {
            findings = browserFindings;
            return proxy.shutdown();
        })
        .then((serverResults) => {
            findings.features = Object.assign(findings.features, serverResults.features);
            findings.requests = Object.assign(findings.requests, serverResults.requests);
            return findings;
        });
}

function browserUsageDetection() {
        const callback = arguments[arguments.length - 1];

        const results = {
            features: {
                applicationCache: window.applicationCache.status === 1,
                localStorage: window.localStorage.length,
                sessionStorage: window.sessionStorage.length,
                serviceWorker: navigator.serviceWorker.controller !== null,
            },
            requests: {
                client: window.performance.getEntries()
            },
            timing: window.performance.timing
        };

        window.indexedDB.webkitGetDatabaseNames().onsuccess = function(sender) {
            results.features.indexedDBs = sender.target.result;
            callback(results);
        };
}

function load(driver, url) {
        driver.get(`https://${url}`);
        driver.manage().timeouts().setScriptTimeout(500);
        driver.sleep(20000);

        return driver.executeAsyncScript(browserUsageDetection)
            .then((res) => {
                console.log(res);
                return driver.quit()
                    .then(() => res);
            });
}


function run(urls, results = {}) {
    if(urls.length === 0) {
        return results;
    }

    const url = urls.shift();

    return runTest(url)
        .then((res) => {
            results[url] = res;
            return run(urls, results)
        });
}

run(websites)
    .then((results) => {

        console.log(results);

        fs.writeFileSync(path.join(__dirname, "../results/techDistribution.json"), JSON.stringify(results, null, 2));
        console.log("DONE");
        process.exit(0);
    })
    .catch((err) => {
        console.error(err.message, err.stack);
        process.exit(1);
    });


