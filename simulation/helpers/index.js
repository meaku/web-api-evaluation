"use strict";

const { networkConnections } = require("../common.config");

exports.NetworkLimiter = require("./NetworkLimiter");
exports.TrafficSniffer = require("./TrafficSniffer");

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