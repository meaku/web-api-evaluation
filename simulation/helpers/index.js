"use strict";

const { defaultNetworks } = require("../common.config");

exports.NetworkLimiter = require("./NetworkLimiter");
exports.TrafficSniffer = require("./TrafficSniffer");
exports.pcap = require("./pcap");

exports.addNetworkingVariations = function(conditions, networks = defaultNetworks) {
    Object.keys(conditions).forEach(key => {
        let variations = [];

        conditions[key].forEach((condition) => {
            Object.keys(networks).forEach(networkName => {
                variations.push(Object.assign({}, condition, {
                    network: networkName
                }, networks[networkName]));
            });
        });

        conditions[key] = variations;
    });
};