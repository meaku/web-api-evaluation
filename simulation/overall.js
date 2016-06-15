"use strict";

const { toChartSeries, swapSeries } = require("./helpers");
const path = require("path");
const { transportDurationsXTransport } = require("./plots");
const Analyzer = require("./Analyzer");
const _ = require("lodash");
const resultDir = path.resolve(__dirname, "../results/simulation/overall");

const analyzer = new Analyzer("results_batch", __dirname);

function fetchDataForType(type, collection, transport, howMany) {
    return analyzer.query({ transport, "condition.howMany": howMany }, {
        "transport": 1,
        "condition.latency": 1
    }, collection)
        .then(res => {
            return res.map(r => {
                r.type = type;
                return r;
            });
        })
}

function plotDurationsXType(transport, howMany, name, fileName) {
    return Promise.all([
        fetchDataForType("Multiple", "results_multiple", transport, howMany),
        fetchDataForType("Batch", "results_batch", transport, howMany),
        fetchDataForType("Stream", "results_stream", transport, howMany)
    ])
        .then((results) => [...results[0], ...results[1], ...results[2]])
        .then((results) => {
            const res = toChartSeries(results, "type", "duration");
            return transportDurationsXTransport({
                name,
                fileName,
                stacked: false
            }, {}, res);
        });
}


function getSeries(transport, howMany) {
    return Promise.all([
        fetchDataForType(`Multiple (${transport})`, "results_multiple", transport, howMany),
        fetchDataForType(`Batch (${transport})`, "results_batch", transport, howMany),
        fetchDataForType(`Stream (${transport})`, "results_stream", transport, howMany)
    ])
        .then((results) => [...results[0], ...results[1], ...results[2]])
        .then((results) => {
            const series = toChartSeries(results, "type", "duration");
            console.log(series);

            /*
             return series.map((group) => {
             if (group.name.indexOf("Multiple") !== -1) {
             group.stack = "multiple";
             }
             else {
             group.stack = "batch";
             }
             return group;
             });
             */
            return series;
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
        )
    })
    .then(() => {
        return Promise.all(mergeVariations.map(config => getSeries(config.transport, config.howMany)))
            .then(res => {
                //with stacking
                return transportDurationsXTransport({
                    name: "Merged",
                    fileName: resultDir + "/merged.pdf",
                    stacked: false
                }, {}, _.flatten(res))
            })

    })
    .catch((err) => console.error(err.message, err.stack));

