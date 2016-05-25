"use strict";

const { hosts, networkConnections } = require("../common.config.js");

const conditions = {
    "transports": [
        {
            transport: "h1",
            url: hosts.h1
        },
        {
            transport: "h2",
            url: hosts.h2
        },
        {
            transport: "ws",
            url: hosts.h1
        }
    ]
};

//TODO make helper
Object.keys(conditions).forEach(key => {
    let variations = [];

    conditions[key].forEach((condition) => {
        Object.keys(networkConnections).forEach(connectionName => {
            variations.push(Object.assign({}, condition, {
                connectionName
            }, networkConnections[connectionName]));
        });
    });

    conditions[key] = variations;
});

function runSimulation(config, callback) {
    start(config.transport).then(res => callback(res.duration));
}

exports.conditions = conditions;
exports.runner = function benchmark(driver, config) {
    if(!config) {
        return Promise.reject(new Error("Missing config"));
    }

    driver.get(config.url);
    driver.manage().timeouts().setScriptTimeout(100000);
    return driver.executeAsyncScript(runSimulation,[config])
        .then((results) => {
            return results;
        });
};

