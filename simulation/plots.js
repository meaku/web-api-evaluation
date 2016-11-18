"use strict";

/**
 * TODO adjust scale
 * yAxis: {
            title: {
                text: 'Temperature'
            },
            id: 'my_y',
            lineWidth: 2,
            lineColor: '#F33',
            min:0,
            max:10
        },
 */

const { toChartSeries, swapSeries, calculateDistribution } = require("./helpers");
const { 
    trafficSize, 
    transportDuration, 
    transportDurationSingleTransport, 
    requestDistribution, 
    pushDuration,
    barChart
} = require("../helpers").chartTemplates;

function trafficXHowMany(config, results) {
    const { xField, yField, categories, fileName, yLabel, xLabel, title } = config;

    const series = toChartSeries(results, xField, yField);

    console.log(series);

    return trafficSize(title, fileName, categories, series, xLabel, yLabel)
}

exports.trafficXDataSize = function (config, results) {
    return trafficXHowMany({
        categories: [20, 40, 60, 80, 100],
        yField: "dataSize",
        xField: "transport",
        yLabel: "Data Size (kB)",
        xLabel: "# Items",
        title: "TCP Data Size",
        fileName: config.fileName
    }, results)
};

exports.trafficXPublishInterval = function (config, results) {
    return trafficXHowMany({
        categories: [1, 5, 10, 30],
        yField: "dataSize",
        xField: "transport",
        yLabel: "Data Size (kB)",
        xLabel: "Publish Interval (s)",
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

exports.transportDurationsXTransport = function ({ config, results, series, yMax }) {
    const { fileName, title } = config;
    series = series || toChartSeries(
        results,
        "transport",
        "duration"
    );

    return transportDuration({ title, fileName, series, stacked: config.stacked, yMax });
};

exports.barChart = function(config, results, series) {
    series = series || toChartSeries(
            results,
            config.xField,
            config.yField
        );
    
    return barChart(Object.assign(config, { series }));
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

function requestDistributionXTransport(config, results) {
    const { fileName } = config;
    const series = calculateDistribution(results);
    
    requestDistribution("Item Distribution", fileName, ["HTTP/1.1", "HTTP/2", "WebSocket"], series);
}

function pushDurationXLatency(config, results) {
    const { fileName, categories } = config;
    const series = toChartSeries(results, "transport", "avgDuration");
    return pushDuration("Push Duration", fileName, categories, series);
}

function uniqueItemsXLatency(config, results) {
    const { fileName, categories } = config;
    const series = toChartSeries(results, "transport", "uniqueCount");
    console.log(series);

    return pushDuration("Unique Items", fileName, categories, series);
}

function uniqueItemsXPublishInterval(config, results) {
    const { fileName, categories } = config;
    const series = toChartSeries(results, "transport", "uniqueCount");
    console.log(series);

    return barChart({
        title: false,
        yLabel: "# Unique Items",
        xLabel: "Publish Interval (s)",
        categories,
        fileName,
        series
    });
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
exports.requestDistributionXTransport = requestDistributionXTransport;
exports.pushDuration = pushDurationXLatency;
exports.uniqueItemsXLatency = uniqueItemsXLatency;
exports.uniqueItemsXPublishInterval = uniqueItemsXPublishInterval;