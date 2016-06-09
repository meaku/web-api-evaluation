"use strict";


let { transportDurationSingleTransport, trafficSize } = require("./helpers").chartTemplates;
const { analyzer } = require("./simulation/helpers");
const { inspect } = require("util");
const resultDir = __dirname + "/results/simulation/multipleDivided/";
const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];

const Promise = require("bluebird");
const mongodb = Promise.promisifyAll(require("mongodb"));
const MongoClient = mongodb.MongoClient;

Promise.promisifyAll(mongodb.Cursor.prototype);

function swapSeries(series, categories) {
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
}

function toChartSeries(results, sName, sValue) {
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

    console.log(series);
    //console.log(inspect(series, { depth: null, colors: true }));
    return Object.keys(series).map(key => {
        return {
            name: key,
            data: series[key].values
        }
    });
}


function percChange(oldResult, newResult) {
    return ((newResult - oldResult) / oldResult).toFixed(2);
}

function insert(db) {
    let results = require("./results/simulation/planets-fetch-2/results.json").transports;
    return db.collection("results-divided").insert(results)
}

function query(db, condition, sort) {
    //todo make collection dynamic
    return db.collection("results-divided")
        .find(condition)
        .sort(sort)
        .toArray()
        .then((res) => {
            return res.map(r => {
                return Object.assign(r.result, r.condition, r.pcap);
            })
        });
}


MongoClient.connect("mongodb://localhost:27017/evaluation").then((db) => {

    //insert(db);

    //plotDetailedTransportDuration(db);
    //compareTransportDurations(db);

    ///*
    plotDataSizeForTransportXHowMany(db);
    plotNumPacketsForTransportXHowMany(db);
    //*/
});

function fetchMultiplePerTransport(db, transport) {
    return query(db, { transport }, { "condition.latency": 1, "condition.howMany": 1 })
        .then(results => toChartSeries(results, "latency", "duration"));
}


function plotDataSizeForTransportXHowMany(db, transport) {
    //return query(db, { "condition.latency": 80 }, { "condition.howMany": 1, "transport": 1 })
    return query(db, {}, { "condition.howMany": 1, "transport": 1 })
        .then(results => toChartSeries(results, "transport", "dataSize"))
        .then(series => {
            trafficSize(`TCP data size`, `${resultDir}/traffic.pdf`, [20, 40, 60, 80, 100], series)
        });
}

function plotNumPacketsForTransportXHowMany(db, transport) {
    //return query(db, { "condition.latency": 80 }, { "condition.howMany": 1, "transport": 1 })
    return query(db, {}, { "condition.howMany": 1, "transport": 1 })
        .then(results => toChartSeries(results, "transport", "numberOfPackets"))
        .then(series => {
            trafficSize(`Number of TCP packets`, `${resultDir}/traffic_packets.pdf`, [20, 40, 60, 80, 100], series, "# Requests", "# TCP Packets")
        });
}

function compareTransportDurations(db) {
    function chartIt(howMany) {
        return query(db, { "condition.howMany": howMany }, { "transport": 1, "condition.latency": 1 })
            .then((results) => {
                analyzer.duration(results, `${resultDir}/duration_${howMany}.pdf`, "bla", "bla", `Duration: ${howMany} items`);
            })
    }

    chartIt(20);
    chartIt(60);
    chartIt(100);
}


function plotDetailedDurationByLatency(transport, categories, series) {
    transportDurationSingleTransport("Load Time subject to # Requests: " + transport, resultDir + "distribution_latency_" + transport.replace("/", "-") + ".pdf", categories, series);
}

function plotDetailedDurationByHowMany(transport, categories, series) {
    let { categories: sCategories, series: sSeries } = swapSeries(series, categories);
    transportDurationSingleTransport("Load Time subject to # of Requests: " + transport, resultDir + "distribution_howMany_" + transport.replace("/", "-") + ".pdf", sCategories, sSeries);
}

function plotDetailedTransportDuration(db) {
    const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];
    let categories = [20, 40, 60, 80, 100];

    return Promise.all(transports.map(transport => {
        return fetchMultiplePerTransport(db, transport)
            .then(series => {
                return {
                    transport,
                    series
                }
            });
    }))
        .then(results => {
            results.forEach(result => {
                let { transport, series } = result;
                plotDetailedDurationByLatency(transport, categories, series);
                plotDetailedDurationByHowMany(transport, categories, series);
            });
        });
}


process.on("unhandledRejection", (err) => console.error(err.message, err.stack));