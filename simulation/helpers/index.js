"use strict";

const fs = require("fs");
const path = require("path");
const { defaultNetworks } = require("../common.config");

exports.NetworkLimiter = require("./NetworkLimiter");
exports.TrafficSniffer = require("./TrafficSniffer");
exports.pcap = require("./pcap");
exports.analyzer = require("./analyzer");

exports.addNetworkingVariations = function (conditions, networks = defaultNetworks) {
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

/**
 * name = howMany
 * variations = [10, 20, 30, 40, 50, 60]
 *
 * @param conditions
 * @param name
 * @param variations
 */
exports.addVariation = function (conditions, name, variations) {
    variations = variations.map(v => {
        let res = {};
        res[name] = v;
        return res;
    });

    Object.keys(conditions).forEach(key => {
        let mixed = [];

        conditions[key].forEach((condition) => {
            Object.keys(variations).forEach(name => {

                mixed.push(
                    Object.assign(
                        {},
                        condition,
                        variations[name]
                    )
                );
            });
        });

        conditions[key] = mixed;
    });
};

exports.delay = function delay(duration, args) {
    return new Promise(resolve => {
        setTimeout(() => resolve(args), duration);
    });
};

exports.loadScript = function loadScript(name) {
    return fs.readFileSync(path.resolve(__dirname, `../scripts/${name}.js`)).toString("utf-8");
};

exports.swapSeries = function swapSeries(series, categories) {
    let newCategories = series.map(s => s.name);
    let final = [];

    series.forEach((result, rowCount) => {
        result.data.forEach((elem, colCount) => {
            final[colCount] = final[colCount] || [];
            final[colCount][rowCount] = elem;
        })
    });

    final = categories.map((name, i) => {
        return {
            name,
            data: final[i]
        }
    });

    return {
        series: final,
        categories: newCategories
    };
};


function percChange(oldResult, newResult) {
    return ((newResult - oldResult) / oldResult).toFixed(2);
}

exports.percChange = percChange;

exports.toChartSeries = function toChartSeries(results, sName, sValue) {
    const series = {};

    results.forEach(r => {
        let name = r[sName];
        let result = r[sValue];

        series[name] = series[name] ||
            {
                diff: [],
                change: [],
                values: []
            };

        if (series[name].values.length >= 1) {
            series[name].change.push(percChange(series[name].values.slice(-1)[0], result));
            series[name].diff.push(result - series[name].values.slice(-1)[0]);
        }

        series[name].values.push(result);
    });
    
    //console.log(inspect(series, { depth: null, colors: true }));
    return Object.keys(series).map(key => {
        return {
            name: key,
            data: series[key].values
        }
    });
};

