"use strict";

exports.htmlTable = require("./htmlTable");
exports.latexTable = require("./latexTable");
exports.chart = require("./charts");

exports.chartDataByNetwork = function(results, valueKey = "duration") {
    const networks = ["2G", "3G", "4G", "Cable", "DSL", "Fiber"];

    return networks.map(network => {
        const data = results
            .filter(result => result.connectionName === network)
            .map(entry => entry.result[valueKey]);

        return [network, ...data];
    });
};