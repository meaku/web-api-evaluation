"use strict";
const path = require("path");
const { barChart } = require("./plots");
const Analyzer = require("./Analyzer");
const _ = require("lodash");
const resultDir = path.resolve(__dirname, "../results/simulation/overall-rt/");
const stats = require("simple-statistics");

const analyzer = new Analyzer("", __dirname);

function fetchDataForType(type, collection, transport, conditions = {}, xValue) {
    const sort = {};

    if (transport) {
        conditions["condition.transport"] = transport;
        sort.transport = 1;
    }

    sort[xValue] = 1;
    return analyzer.query(conditions, sort, collection)
        .then(res => {
            return res.map(result => {
                result.type = type;

                result.pollingInterval = result.pollingInterval / 1000;
                result.realtimeInterval = result.realtimeInterval / 1000;

                let durations = result.durations.map(r => r.duration);
                result.uniqueCount = durations.length;
                result.avgDuration = stats.mean(durations);

                return result;
            });
        })
}

function getSeries(transport, conditions, xValue) {
    return Promise.all([
        fetchDataForType(`Long Polling`, "results_long_polling", transport, conditions, xValue),
        fetchDataForType(`Streamed Polling`, "results_streamed_polling", transport, conditions, xValue),
        fetchDataForType(`Polling (1s)`, "results_polling", transport, Object.assign(conditions, { "condition.pollingInterval": 1000 }), xValue)
    ])
        .then((results) => [...results[0], ...results[1], ...results[2]])
}

function getSeriesNonHTTP(transport, conditions, xValue) {
    return Promise.all([
        fetchDataForType(`WebSocket`, "results_websocket", transport, conditions, xValue),
        fetchDataForType(`WebPush`, "results_webpush", transport, conditions, xValue)
    ])
        .then((results) => [...results[0], ...results[1]])
        .then(results => results.map(r => {
            r.type = r.transport;
            return r;
        }))
}

const variations = [
    { transport: "HTTP/2", latency: 20 },
    { transport: "HTTP/2", latency: 640 },
    { transport: "HTTP/1.1", latency: 20 },
    { transport: "HTTP/1.1", latency: 640 }
];

const nonHTTPVariations = [
    { latency: 20 },
    { latency: 640 }
];

analyzer.connect()
    .then(() => {
        return Promise.all(
            nonHTTPVariations.map(config => {
                const { latency } = config;
                const name = `Mean Publish Time: Non-HTTP, ${latency}`;
                const fileName = `${resultDir}/mpt_nonhttp_${latency}.pdf`;

                return getSeriesNonHTTP(null, { "condition.latency": latency }, "condition.realtimeInterval")
                    .then((results) => {
                        return barChart({
                            name,
                            fileName,
                            xField: "type",
                            xLabel: "Publish Interval (s)",
                            yLabel: "Mean Publish Time (ms)",
                            yField: "avgDuration",
                            categories: [1, 5, 10]
                        }, results);
                    });
            })
        );
    })
    .then(() => {
        return Promise.all(
            nonHTTPVariations.map(config => {
                const { latency } = config;
                const name = `Reliability: Non-HTTP, ${latency}`;
                const fileName = `${resultDir}/unique_items_nonhttp_${latency}.pdf`;

                return getSeriesNonHTTP(false, { "condition.latency": latency }, "condition.realtimeInterval")
                    .then((results) => {
                        return barChart({
                            name,
                            fileName,
                            xField: "type",
                            yMax: 10,
                            xLabel: "Publish Interval (s)",
                            yLabel: "# Unique Items",
                            yField: "uniqueCount",
                            categories: [1, 5, 10]
                        }, results);
                    });
            })
        );
    })
    .then(() => {
        return Promise.all(
            variations.map(config => {
                const { transport, latency } = config;
                const yMax = latency === 20 ? 50 : 800;
                const name = `Mean Publish Time: ${transport}, ${latency}`;
                const fileName = `${resultDir}/mpt_${transport.replace("/", "-")}_${latency}.pdf`;

                return getSeries(transport, { "condition.latency": latency }, "condition.realtimeInterval")
                    .then((results) => {
                        return barChart({
                            name,
                            fileName,
                            xField: "type",
                            xLabel: "Publish Interval (s)",
                            yLabel: "Mean Publish Time (ms)",
                            yField: "avgDuration",
                            yMax,
                            categories: [1, 5, 10]
                        }, results);
                    });
            })
        );
    })
    .then(() => {
        return Promise.all(
            variations.map(config => {
                const { transport, latency } = config;
                const name = `Reliability: ${transport}, ${latency}`;
                const fileName = `${resultDir}/unique_items_${transport.replace("/", "-")}_${latency}.pdf`;

                return getSeries(transport, { "condition.latency": latency }, "condition.realtimeInterval")
                    .then((results) => {
                        return barChart({
                            name,
                            fileName,
                            xField: "type",
                            xLabel: "Publish Interval (s)",
                            yLabel: "# Unique Items",
                            yMax: 10,
                            yField: "uniqueCount",
                            categories: [1, 5, 10]
                        }, results);
                    });
            })
        );
    })
    .then(() => {
        return Promise.all(
            ["HTTP/1.1", "HTTP/2"].map(transport => {
                return getSeries(transport, { "condition.latency": 20 }, "condition.realtimeInterval")
                    .then(results => {
                        return barChart({
                            name: `Traffic: ${transport}`,
                            fileName: `${resultDir}/traffic_${transport.replace("/", "-")}.pdf`,
                            xField: "type",
                            xLabel: "Publish Interval (s)",
                            yLabel: "Data Size (kB)",
                            yMax: 125,
                            yField: "dataSize",
                            categories: [1, 5, 10]
                        }, results);
                    });
            })
        )
    })
    .then(() => {
        console.log("done");
        process.exit(0);
    })
    .catch((err) => console.error(err.message, err.stack));

