"use strict";

const { toChartSeries, swapSeries } = require("./helpers");
const { trafficSize, transportDuration, transportDurationSingleTransport } = require("../helpers").chartTemplates;

function trafficXHowMany(config, results) {
    const { yField, fileName, yLabel, xLabel, title } = config;

    const series = toChartSeries(results, "transport", yField);
    return trafficSize(title, fileName, [20, 40, 60, 80, 100], series, xLabel, yLabel)
}

exports.trafficXDataSize = function (config, results) {
    return trafficXHowMany({
        yField: "dataSize",
        yLabel: "# Data Size (kB)",
        xLabel: "# Items",
        title: "TCP Data Size",
        fileName: config.fileName
    }, results)
};

exports.trafficXNumberOfPackets = function (config, results) {
    return trafficXHowMany({
        yField: "numberOfPackets",
        yLabel: "# TCP Packets",
        xLabel: "# Items",
        title: "Number of TCP packets",
        fileName: config.fileName
    }, results)
};

exports.transportDurationsXTransport = function (config, results, series) {
    const { fileName, title } = config;
    series = series || toChartSeries(
        results,
        "transport",
        "duration"
    );

    return transportDuration(title, fileName, series, config.stacked);
};

function durationXLatency(config, results) {
    let { categories, filePath, transport} = config;
    let series = toChartSeries(results, "latency", "duration");
    
    return transportDurationSingleTransport("Load Time subject to Latency: " + transport, filePath, categories, series);
}

function durationXHowMany(config, results) {
    let { categories, filePath, transport} = config;
    let series = toChartSeries(results, "latency", "duration");
    let { categories: sCategories, series: sSeries } = swapSeries(series, categories);

    return transportDurationSingleTransport("Load Time subject to # of Requests: " + transport, filePath, sCategories, sSeries);
}

/**
 * results must be limited to a transport
 * { transport }, { "condition.latency": 1, "condition.howMany": 1 }
 * 
 * @param config
 * @param results
 * @returns {Promise}
 */
function transportDurationPerTransport(config, results) {
    let { categories, transport, resultDir } = config;
    
    return Promise.all([
        durationXLatency({
            categories,
            transport,
            filePath: resultDir + "/distribution_latency_" + transport.replace("/", "-") + ".pdf"
        }, results),
        durationXHowMany({
            categories,
            transport,
            filePath: resultDir + "/distribution_howMany_" + transport.replace("/", "-") + ".pdf"
        }, results)
    ]);
}

exports.transportDurationPerTransport = transportDurationPerTransport;