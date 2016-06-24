"use strict";

const { toChartSeries, swapSeries } = require("./helpers");
const path = require("path");
const { transportDurationsXTransport, barChart } = require("./plots");
const Analyzer = require("./Analyzer");
const _ = require("lodash");
const resultDir = path.resolve(__dirname, "../results/simulation/overall");
const stats = require("simple-statistics");

const analyzer = new Analyzer("results_batch", __dirname);

function fetchDataForType(type, collection, transport, conditions, xValue) {
    const condition = Object.assign({ transport }, conditions);
    const sort = {
        "transport": 1
    };

    sort[xValue] = 1;

    return analyzer.query(condition, sort, collection)
        .then(res => {
            return res.map(r => {
                let ttds = r.measures
                    .filter(m => m.name.indexOf("ttd") !== -1)
                    .map(m => m.duration);

                r.type = type;
                r.min = stats.min(ttds);
                r.max = stats.max(ttds);

                return r;
            });
        })
}

function getSeries(transport, conditions, xValue) {
    return Promise.all([
        fetchDataForType(`Multiple`, "results_multiple", transport, conditions, xValue),
        fetchDataForType(`Batch`, "results_batch", transport, conditions, xValue),
        fetchDataForType(`Stream`, "results_stream", transport, conditions, xValue)
    ])
        .then((results) => [...results[0], ...results[1], ...results[2], ...results[3]])
}

function plotDurationsXType(transport, howMany, name, fileName) {
    return getSeries(transport, { "condition.howMany": howMany }, "condition.latency")
        .then((results) => {
            const res = toChartSeries(results, "type", "duration");
            return transportDurationsXTransport({
                name,
                fileName,
                stacked: false
            }, {}, res);
        });
}


const variations = [
    { transport: "HTTP/2", howMany: 20 },
    { transport: "HTTP/2", howMany: 100 },
    { transport: "HTTP/1.1", howMany: 20 },
    { transport: "HTTP/1.1", howMany: 100 },
    { transport: "WebSocket", howMany: 20 },
    { transport: "WebSocket", howMany: 100 }
];

const mergeVariations = [
    { transport: "HTTP/2", howMany: 20 },
    { transport: "HTTP/1.1", howMany: 20 },
    { transport: "WebSocket", howMany: 20 }
];

analyzer.connect()
    .then(() => {
        return Promise.all(
            variations.map(config => {
                const { transport, howMany } = config;
                const name = `Duration: ${transport}, ${howMany}`;
                const fileName = `${resultDir}/${transport.replace("/", "-")}_${howMany}.pdf`;
                return plotDurationsXType(transport, howMany, name, fileName);

            })
        );
    })
    .then(() => {
        return Promise.all(
            ["HTTP/1.1", "HTTP/2", "WebSocket"].map(transport => {
                return getSeries(transport, { "condition.latency": 80 }, "condition.howMany")
                    .then(results => {
                        console.log(results);

                        return barChart({
                            name: `Traffic: ${transport}`,
                            fileName: `${resultDir}/traffic_${transport.replace("/", "-")}.pdf`,
                            xField: "type",
                            xLabel: "# Items",
                            yLabel: "Data Size (kB)",
                            yField: "dataSize",
                            categories: [20, 40, 60, 80, 100]
                        }, results);
                    });
            })
        )
    })
    .then(() => {
        return Promise.all(
            variations.map(config => {
                let { howMany, transport} = config;

                return getSeries(transport, { "condition.howMany": howMany }, "condition.latency")
                    .then(results => {
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
    .then(() => {
        return Promise.all(mergeVariations.map(config => getSeries(config.transport, config.howMany)))
            .then((results) => {

            })
            .then(results => {
                const series = toChartSeries(results, "type", "duration");

                //with stacking
                return transportDurationsXTransport({
                    name: "Merged",
                    fileName: resultDir + "/merged.pdf",
                    stacked: false
                }, {}, _.flatten(series))
            })

    })
    .catch((err) => console.error(err.message, err.stack));

