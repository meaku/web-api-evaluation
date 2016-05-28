"use strict";

const fs = require("fs");
const webdriver = require("selenium-webdriver");

const sequence = require("when/sequence");
const guard = require("when/guard");

const { NetworkLimiter, TrafficSniffer } = require("./helpers");

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
            let sniffer; 
            let trafficFile = false;
            
            if(condition.sniffPort) {
                trafficFile = resultDir + "/traffic_" + count++ + ".pcap";
                sniffer = new TrafficSniffer();
                sniffer.start(condition.sniffPort, trafficFile);    
            }
            
            console.log("running", condition);

            return limiter.throttle(condition.latency || false)
                .then(() => runner(driver, condition))
                .then((result) => {
                    return driver.quit()
                        .then(() => {
                            if(sniffer) {
                                sniffer.stop();       
                            }
                         
                            return {
                                condition, 
                                result,
                                trafficFile
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
                       result = {
                           name: conditionName,
                           result
                       };

                       fs.writeFileSync(resultDir + "/results.json", JSON.stringify(result));

                       return result;
                   })
            })
    )
        .then((results) => {
            //remap
            const res = {};

            results.forEach((result) => {
                res[result.name] = result.result;
            });

            return res;
        });
}

process.on("unhandledRejection", (err) => console.error(err));

module.exports = runGroup;
