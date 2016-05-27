"use strict";

const { networkConnections } = require("../common.config");
const fs = require("fs");
const path = require("path");

exports.NetworkLimiter = require("./NetworkLimiter");

exports.addNetworkingVariations = function(conditions, connectionSettings = networkConnections) {
    Object.keys(conditions).forEach(key => {
        let variations = [];

        conditions[key].forEach((condition) => {
            Object.keys(connectionSettings).forEach(connectionName => {
                variations.push(Object.assign({}, condition, {
                    connectionName
                }, connectionSettings[connectionName]));
            });
        });

        conditions[key] = variations;
    });
};

exports.saveResults = function(name, data) {
  return fs.writeFileSync(path.resolve(__dirname, `../../results/${name}.json`), JSON.stringify(data));
};