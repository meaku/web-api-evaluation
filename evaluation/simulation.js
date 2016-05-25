"use strict";

const webdriver = require("selenium-webdriver");

const sequence = require("when/sequence");
const { NetworkLimiter } = require("./helpers");

const limiter = new NetworkLimiter();

const simulations = require("./simulations");

function getDriver() {
    //global settings
    const driver = new webdriver.Builder()
        .usingServer("http://192.168.99.100:4444/wd/hub")
        .forBrowser("firefox")
        .build();

    driver.manage().timeouts().setScriptTimeout(50000);

    return driver;
}

const conditions = {
    "2G": {
        latency: "650ms"
    },
    "3G": {
        latency: "300ms"
    },
    "4G": {
        latency: "100ms"
    },
    "DSL": {
        latency: "35ms"
    },
    "Cable": {
        latency: "20ms"
    },
    "Fiber": {
        latency: "10ms"
    }
};

//duplicate conditions by looping and adding different urls?

function runSimulation(simulation) {
    //TODO make dynamic
    const url = "https://192.168.99.100:3001";

    const sets = Object.keys(conditions).map(conditionName => {
        const condition = conditions[conditionName];

        return function run(url) {
            console.log("Running :" + conditionName);

            const driver = getDriver();

            return limiter.throttle(condition.latency)
                .then(() => simulation(driver, url))
                .then((result) => {
                    console.log(result);

                    return driver.quit()
                        .then(() => {
                            return {
                                name: conditionName,
                                result
                            }
                        });
                });
        }
    });

    return sequence(sets, url);
}

runSimulation(simulations.multipleSmallRequests)
    .then((res) => console.log(res));

process.on("unhandledRejection", (err) => console.error(err));

