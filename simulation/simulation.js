"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const path = require("path");
const fs = require("fs");
const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fetch = require("node-fetch");

const chromePreferences = {
    profile: {
        content_settings: {
            exceptions: {
                notifications: {}
            }
        }
    }
};

chromePreferences.profile.content_settings.exceptions.notifications["https://simulation-server:3002" + ',*'] = {
    setting: 1
};
chromePreferences.profile.content_settings.exceptions.notifications["https://simulation-server:3001" + ',*'] = {
    setting: 1
};

const simulationHost = "localhost";
//const simulationHost = "ec2-54-93-72-83.eu-central-1.compute.amazonaws.com";

const chromeOptions = new chrome.Options({
        args: "--enable-benchmarking"
    })
    .setUserPreferences(chromePreferences);

const sequence = require("when/sequence");
const guard = require("when/guard");

const { NetworkLimiter, TrafficSniffer, pcap, delay } = require("./helpers");

function getDriver(browser = "chrome") {
    //global settings
    const driver = new webdriver.Builder()
        .usingServer(`http://${simulationHost}:4444/wd/hub`)
        .forBrowser(browser)
        .setChromeOptions(chromeOptions)
        .build();

    driver.manage().timeouts().setScriptTimeout(5000000);

    return driver;
}

let count = 0;

/**
 * run a single simulation case
 *
 * @param {Object} conditions
 * @param {String} script
 * @param {Function} runner
 * @param {String} resultDir
 * @returns {Promise}
 */
function runSimulation(conditions, script, runner, resultDir) {
    //limiter is reused
    const limiter = new NetworkLimiter(`application@${simulationHost}:22222`);
    
    const sets = conditions.map(condition => {

        return function run() {
            const driver = getDriver(condition.browser);
            const sniffer = new TrafficSniffer(`application@${simulationHost}:22222`);
            const trafficFile = `${resultDir}/traffic_${count++}.pcap`;

            driver.get(condition.url);
            driver.manage().timeouts().setScriptTimeout(100000000);
            
            return driver.executeScript(script || function() {})
                .then(() => console.log("script loaded"))
                .then(() => sniffer.start(condition.sniffPort || false, trafficFile))
                .then(() => limiter.throttle(condition.latency || false))
                .then(() => delay(2000)) //ensure sniffer is running
                .then(() => {
                    //get port of simulation-server and request externally to start event emitting
                    const [host, port] = condition.baseUrl.split(":");
                    const simulationServer = `${simulationHost}:${port}`;
                    
                    if(condition.realtimeInterval && condition.transport !== "WebPush") {
                        console.log("execute script", condition);
                        runner(driver, condition);

                        console.log(`GET https://${simulationServer}/start/${condition.realtimeInterval}`);
                        return fetch(`https://${simulationServer}/start/${condition.realtimeInterval}`)
                            .then(res => res.json());
                    }

                    console.log("execute script", condition);
                    return runner(driver, condition);
                })
                .then((result) => {
                    if(condition.realtimeInterval) {
                        if(result.status !== "success") {
                            throw new Error("Server responded with error: " + result.error);
                        }
                        
                        return driver.executeScript(function() { return window.results; })
                            .then(results => {
                                console.log("before", results.durations.length);
                                results.durations = results.durations.filter((d) => d.received <= result.end);
                                console.log("after", results.durations.length);
                                return results;
                            })
                    }
                    return result;
                })
                .then(result => {
                    console.log(result);

                    if(!result || result.error) {
                        driver.quit()
                            .then(() => {
                                if(result.error) {
                                    console.error(result.error, result.stack);
                                    throw new Error("Simulation failed: " + result.error);
                                }

                                throw new Error("Simulation returned an empty result");
                            });
                    }

                    return driver.quit()
                        .then(() => {
                            if (condition.sniffPort) {
                                return sniffer.stop()
                                    //ensure pcap is written to disk
                                    .then(() => delay(1000))
                                    .then(() => console.log("pcap!"))
                                    .then(() => pcap(trafficFile))
                                    .then(pcap => {
                                        return {
                                            network: condition.network,
                                            transport: condition.transport,
                                            condition,
                                            result,
                                            trafficFile,
                                            pcap
                                        };
                                    })
                                    .catch((err) => console.error(err.message, err.stack));
                            }

                            return {
                                network: condition.network,
                                transport: condition.transport,
                                condition,
                                result
                            };
                        });
                });
        }
    });

    return sequence(sets);
}

//limit to a single runSimulation call at a time
const run = guard(guard.n(1), runSimulation);

/**
 * run a group of simulations
 *
 * @param {Object} conditions
 * @param {String} script
 * @param {Function} runner
 * @param {String} resultDir
 * @returns {Promise}
 */
function runSimulationGroup(conditions, script, runner, resultDir) {
    if (Array.isArray(conditions)) {
        conditions = {
            "default": conditions
        };
    }

    return Promise.all(
        Object
            .keys(conditions)
            .map(conditionName => {
                return run(conditions[conditionName], script, runner, resultDir)
                    .then(result => {
                        return {
                            name: conditionName,
                            result
                        };
                    })
            })
    )
        .then((results) => {
            //remap
            const res = {};

            results.forEach((result) => {
                res[result.name] = result.result;
            });

            fs.writeFileSync(resultDir + "/results.json", JSON.stringify(res));
            return res;
        });
}

process.on("unhandledRejection", console.error);

module.exports = runSimulationGroup;
