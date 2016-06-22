"use strict";

const { toChartSeries, swapSeries } = require("./helpers");
const path = require("path");
const { barChart } = require("./plots");
const Analyzer = require("./Analyzer");
const _ = require("lodash");
const resultDir = path.resolve(__dirname, "../results/simulation/overall-rt/");
const stats = require("simple-statistics");

const analyzer = new Analyzer("results_batch", __dirname);

function fetchDataForType(type, collection, transport, conditions, xValue) {
    const condition = Object.assign({ "condition.transport": transport }, conditions);
    const sort = {
        "transport": 1
    };

    sort[xValue] = 1;

    return analyzer.query(condition, sort, collection)
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
        fetchDataForType(`SSE`, "results_sse", transport, conditions, xValue),
        fetchDataForType(`Polling (1s)`, "results_polling", transport, Object.assign(conditions, { "condition.pollingInterval": 1000 }), xValue)
    ])
        .then((results) => [...results[0], ...results[1], ...results[2], ...results[3]])
}

const variations = [
    { transport: "HTTP/2", latency: 20 },
    { transport: "HTTP/2", latency: 640 },
    { transport: "HTTP/1.1", latency: 20 },
    { transport: "HTTP/1.1", latency: 640 }
];

analyzer.connect()
    .then(() => {
        return Promise.all(
            variations.map(config => {
                const { transport, latency } = config;
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
                            categories: [1, 5, 10, 30]
                        }, results);
                    });
            })
        );
    })
    .then(() => {
        return Promise.all(
            variations.map(config => {
                const { transport, latency } = config;
                const name = `Mean Publish Time: ${transport}, ${latency}`;
                const fileName = `${resultDir}/unique_items_${transport.replace("/", "-")}_${latency}.pdf`;

                return getSeries(transport, { "condition.latency": latency }, "condition.realtimeInterval")
                    .then((results) => {
                        return barChart({
                            name,
                            fileName,
                            xField: "type",
                            xLabel: "Publish Interval (s)",
                            yLabel: "# Unique Items",
                            yField: "uniqueCount",
                            categories: [1, 5, 10, 30]
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
                            yField: "dataSize",
                            categories: [1, 5, 10, 30]
                        }, results);
                    });
            })
        )
    })
    /*
     .then(() => {
     return Promise.all(
     variations.map(config => {
     let { howMany, transport } = config;

     return getSeries(transport, { "condition.howMany": howMany }, "condition.latency")
     .then(results => {
     console.log(results);

     return barChart({
     name: `Traffic: ${transport}`,
     fileName: `${resultDir}/ttfi_${transport.replace("/", "-")}_${howMany}.pdf`,
     xField: "type",
     xLabel: "Latency (ms)",
     yLabel: "TTFI (ms)",
     yField: "min",
     categories: [20, 40, 80, 160, 320, 640]
     }, results);
     });
     })
     )
     })
     */
    .catch((err) => console.error(err.message, err.stack));

