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
    ],
    "compression": [
        {
            transport: "h1",
            compression: true,
            url: hosts.h1
        },
        {
            transport: "h2",
            compression: true,
            url: hosts.h2
        },
        {
            transport: "ws",
            compression: true,
            url: hosts.h1
        }
    ]
};

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

function runSimulation(callback) {
    start().then(res => callback(res));
}

module.exports = function benchmark(driver, url) {
    driver.get(url);
    driver.manage().timeouts().setScriptTimeout(100000);
    return driver.executeAsyncScript(runSimulation);
};



