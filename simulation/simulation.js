"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fs = require("fs");
const webdriver = require("selenium-webdriver");
const fetch = require("node-fetch");

const sequence = require("when/sequence");
const guard = require("when/guard");

const { NetworkLimiter, TrafficSniffer, pcap, delay } = require("./helpers");

//limiter is reused
const limiter = new NetworkLimiter();

function getDriver(browser = "chrome") {
    //global settings
    const driver = new webdriver.Builder()
        .usingServer("http://192.168.99.100:4444/wd/hub")
        .forBrowser(browser)
        .build();

    driver.manage().timeouts().setScriptTimeout(5000000);

    return driver;
}

let count = 0;

function realtime() {
    
}

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
    const sets = conditions.map(condition => {

        return function run() {
            const driver = getDriver(condition.browser);
            const sniffer = new TrafficSniffer();
            const trafficFile = `${resultDir}/traffic_${count++}.pcap`;

            driver.get(condition.url);
            driver.manage().timeouts().setScriptTimeout(10000000);
            console.log("execute script");

            return driver.executeScript(script)
                .then(() => console.log("script loaded"))
                .then(() => sniffer.start(condition.sniffPort || false, trafficFile))
                .then(() => limiter.throttle(condition.latency || false))
                .then(() => delay(2000)) //ensure sniffer is running
                .then(() => console.log("run", condition))
                .then(() => runner(driver, condition))
                .then((results) => {
                    if(condition.realtimeInterval) {
                        console.log(`GET https://${condition.baseUrl}/start/${condition.realtimeInterval}`);
                        return fetch(`https://${condition.baseUrl}/start/${condition.realtimeInterval}`)
                            .then(res => res.json());
                    }
                    
                    return results;
                })
                .then((result) => {
                    if(condition.realtimeInterval) {
                        
                        if(result.status !== "success") {
                            throw new Error("Server responsed with error: " + result.error);
                        }
                        
                        return driver.executeScript(function() { return window.results; })
                    }
                    return result;
                })
                .then((result) => {
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
                                    .then(() => delay(200))
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

process.on("unhandledRejection", (err) => console.error(err));

module.exports = runSimulationGroup;
