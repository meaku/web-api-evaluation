"use strict";

const webdriver = require("selenium-webdriver");
const { inspect } = require("util");

const sequence = require("when/sequence");
const guard = require("when/guard");

const { NetworkLimiter } = require("./helpers");

const limiter = new NetworkLimiter();

const simulations = require("./simulations");

function getDriver(browser = "chrome") {
    //global settings
    const driver = new webdriver.Builder()
        .usingServer("http://192.168.99.100:4444/wd/hub")
        .forBrowser(browser)
        .build();

    driver.manage().timeouts().setScriptTimeout(50000);

    return driver;
}

function runSimulation(conditions, runner) {
    const sets = conditions.map(condition => {

        return function run() {
            const driver = getDriver(condition.browser);

            console.log("running", condition);

            return limiter.throttle(condition.latency || "0ms")
                .then(() => runner(driver, condition))
                .then((result) => {
                    return driver.quit()
                        .then(() => {
                            return {
                                condition, result
                            }
                        });
                });
        }
    });

    return sequence(sets);
}

const run = guard(guard.n(1), runSimulation);

function runGroup(simulation, name) {
    let { conditions, runner } = simulation;

    if (Array.isArray(conditions)) {
        conditions = {
            main: conditions
        };
    }

    return Promise.all(
        Object
            .keys(conditions)
            .map(conditionName => {
                return run(conditions[conditionName], runner)
                    .then((results) => {
                        return {
                            name,
                            results
                        };
                    });
            })
    );
}

Promise.all(
    Object
        .keys(simulations)
        .map(key => runGroup(simulations[key], key))
    )
    .then(res => {

        //console.log(inspect(res, { depth: null, colors: true }));
        process.exit(0);
    });

process.on("unhandledRejection", (err) => console.error(err));

