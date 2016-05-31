"use strict";

const fs = require("fs");
const webdriver = require("selenium-webdriver");

const sequence = require("when/sequence");
const guard = require("when/guard");

const { NetworkLimiter, TrafficSniffer, pcap } = require("./helpers");

function delay(duration, args) {
    return new Promise(resolve => {
        setTimeout(() => resolve(args), duration);
    });
}

const limiter = new NetworkLimiter();

function getDriver(browser = "chrome") {
    //global settings
    const driver = new webdriver.Builder()
        .usingServer("http://192.168.99.100:4444/wd/hub")
        .forBrowser(browser)
        .build();

    driver.manage().timeouts().setScriptTimeout(50000);

    return driver;
}

let count = 0;

function runSimulation(conditions, runner, resultDir) {
    const sets = conditions.map(condition => {

        return function run() {
            const driver = getDriver(condition.browser);
            let sniffer = new TrafficSniffer();
            let trafficFile = false;

            if (condition.sniffPort) {
                trafficFile = resultDir + "/traffic_" + count++ + ".pcap";
                // sniffer.start(condition.sniffPort, trafficFile);
            }

            return sniffer.start(condition.sniffPort || false, trafficFile)
                .then(() => limiter.throttle(condition.latency || false))
                .then(() => delay(2000)) //ensure sniffer is running
                .then(() => console.log("run", condition))
                .then(() => runner(driver, condition))
                //.then((result) => delay(2000, result))
                .then((result) => {

                    return driver.quit()
                        .then(() => {
                            if (sniffer) {
                                return sniffer.stop()
                                    .then(() => delay(200))
                                    //.then(() => console.log("next!"))
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

const run = guard(guard.n(1), runSimulation);

function runGroup(conditions, runner, resultDir) {
    if (Array.isArray(conditions)) {
        conditions = {
            "default": conditions
        };
    }

    return Promise.all(
        Object
            .keys(conditions)
            .map(conditionName => {
                return run(conditions[conditionName], runner, resultDir)
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

module.exports = runGroup;
