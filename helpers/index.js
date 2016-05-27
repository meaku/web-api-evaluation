"use strict";

exports.htmlTable = require("./htmlTable");
exports.latexTable = require("./latexTable");
exports.chart = require("./charts");
exports.networks = ["2G", "3G", "4G", "DSL", "Cable", "Fiber"];

exports.chartDataByNetwork = function (results, valueKey = "duration") {
    const networks = ["2G", "3G", "4G", "DSL", "Cable", "Fiber"];

    return networks.map(network => {
        const data = results
            .filter(result => result.connectionName === network)
            .map(entry => entry.result[valueKey]);

        return [network, ...data];
    });
};

/*
 h1 2G 6533.94
 h1 4G 935.9
 h1 DSL 351.345
 h1 Cable 216.185
 h1 Fiber 130.1
 h1 3G 2733.025
 h2 2G 5884.765
 h2 3G 2736.12
 h2 4G 937.3
 h2 DSL 348.68
 h2 Cable 218.205
 h2 Fiber 125.335
 ws 2G 5886.425
 ws 3G 2734.595
 ws 4G 934.58
 ws DSL 355.11
 ws Cable 216.495
 ws Fiber 126.6
 
 => 

[{
    name: "John",
    data: [5, 3, 4]
 },
 {
    name: "Jane",
    data: [2, 2, 3]
}]
 */

function sortByOrder(order) {
    console.log(order);
    return function(a, b) {
        return order.indexOf(a) - order.indexOf(b);
    }
}

exports.toChartSeries = function (results, name, data = "duration", names, sortEntries) {
    return Object.keys(names).map(n => {

        const entries = results
            .filter(result => result[name] === n)
            //.sort(sortByOrder(sortEntries))
            .map(entry => entry[data]);

        return {
            name: names[n],
            data: entries
        }
    });

    /*
    const chartSeries = {};

    results = results.sort(sortBy(name));

    results.forEach(result => {
        const key = result[name];

        console.log(key, result);

        if (!chartSeries[key]) {
            chartSeries[key] = {
                name: key,
                data: [result[data]]
            };
        }
        else {
            chartSeries[key].data.push(result[data]);
        }
    });

    return Object.keys(chartSeries).map((key) => chartSeries[key]);
    */
};

exports.chartTemplates = require("./charts/templates");