"use strict";

const fs = require("fs");
const path = require("path");
const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fork = require("child_process").fork;

const results = require("../results/top100_techDistribution.json");

class Proxy {
    constructor(domain, port){
        this.domain = domain;
        this.port = port;
    }
    
    start() {
        const self = this;
        return new Promise((resolve, reject) => {
            const px = self.px = fork(path.join(__dirname, "./proxy.js"), {
                env: Object.assign(process.env, {
                    PROXY_PORT: self.port,
                    PROXY_DOMAIN: self.domain
                })
            });

            //px.stdout.pipe(process.stdout);
            //px.stderr.pipe(process.stderr);

            px.once("message", (msg) => {
                if(msg.cmd === "ready") {
                    resolve();
                }
            });

            px.on("close", (code) => {
                reject(new Error("rejected with " + code));
            });
        });      
    }

    shutdown() {
        const self = this;
        return new Promise((resolve, reject) => {

            self.px.on("message", (msg) => {
                if(msg.cmd === "results") {
                    resolve(msg.results);
                }
            });

            self.px.send({
                cmd: "shutdown"
            });
        });
    }
}

//const initProxy = require("./proxy");

let websites = require("../data/top100Wikipedia.json").map((website) => website.domain);
let port = 9000;

const checkedDomains = Object.keys(results);
websites = websites.filter((domain) => checkedDomains.indexOf(domain) === -1);

console.log("Checking " + websites.length + " websites");

function runTest(domain) {
    const proxyPort = port++;

    if(proxyPort >= 9010) {
        port = 9000;
    }
    
    const proxy = new Proxy(domain, proxyPort);
    let findings = {};

    return proxy.start()
        .then(() => {

            var driver = new webdriver.Builder()
                .forBrowser("chrome")
                .setChromeOptions(
                    new chrome.Options().setProxy({
                        proxyType: "manual",
                        httpProxy: "localhost:" + proxyPort,
                        sslProxy: "localhost:" + proxyPort
                    })
                )
                .build();
            
            driver.manage().timeouts().pageLoadTimeout(140000);

            return load(driver, domain);
        })
        .then((browserFindings) => {
            findings = browserFindings || {};
            return proxy.shutdown();
        })
        .then((serverResults) => {
            Object.assign(findings.features || {}, serverResults.features || {});
            Object.assign(findings.requests || {}, serverResults.requests || {});
            return findings;
        });
}

function browserUsageDetection() {
    const callback = arguments[arguments.length - 1];

    try {
        const results = {
            features: {
                applicationCache: window.applicationCache.status === 1,
                localStorage: window.localStorage.length,
                sessionStorage: window.sessionStorage.length,
                serviceWorker: navigator.serviceWorker.controller !== null
            },
            requests: {
                client: window.performance.getEntries()
            },
            timing: window.performance.timing
        };

        window.indexedDB.webkitGetDatabaseNames().onsuccess = function (sender) {
            results.features.indexedDBs = sender.target.result;
            callback(results);
        };
    }
    catch (err) {
        callback({
            error: err
        });
    }
}

function load(driver, url) {
    driver.get(`https://${url}`);
    driver.manage().timeouts().setScriptTimeout(500);
    driver.sleep(15000);

    return driver.executeAsyncScript(browserUsageDetection)
        .then((res) => {
            return driver.quit()
                .then(() => res);
        });
}


function run(urls, results = {}) {
    if (urls.length === 0) {
        return results;
    }

    const url = urls.shift();
    console.log(`Requesting ${url}`);

    return runTest(url)
        .then((res) => {
            results[url] = res;
            return run(urls, results);
        })
        .catch((err) => {
            console.error("Skipping " + url + " " + err.message);
            return run(urls, results);
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
        console.log("Error caught");
        console.error(err.message, err.stack);
        process.exit(1);
    });

process.on("unhandledRejection", (err) => {
    throw err;
});

process.on("uncaughtException", (err) => {
    console.error(err.message, err.stack);
    process.exit(1);
});