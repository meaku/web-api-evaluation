"use strict";

let results = require("./results/simulation/planets-fetch-2/results.json").transports;
let { transportDurationSingleTransport } = require("./helpers").chartTemplates;
const { analyzer } = require("./simulation/helpers");
const { inspect } = require("util");

const Promise = require("bluebird");
const mongodb = Promise.promisifyAll(require("mongodb"));
const MongoClient = mongodb.MongoClient;

Promise.promisifyAll(mongodb.Cursor.prototype);

function resultByHowMany(db, howMany) {
    return db.collection("results")
        .find()
        //.find({ "condition.howMany": howMany })
        .sort({ latency: 1, transport: 1, "condition.howMany": 1 })
        .toArray()
        .then((res) => {
            return res
                .map(r => {
                    return Object.assign(r.result, r.condition, r.pcap);
                })
                .map(r => {
                    let res = {
                        network: r.latency,
                        transport: r.transport,
                        howMany: r.howMany,
                        duration: r.duration,
                        dataSize: r.dataSize
                    };

                    res["howMany-" + r.howMany] = r.duration;

                    return res;
                });
        });
}

function query(db, condition, sort) {
    return db.collection("results")
        .find(condition)
        .sort(sort)
        .toArray()
        .then((res) => {
            return res.map(r => {
                return Object.assign(r.result, r.condition, r.pcap);
            })
        });
}

function percChange(oldResult, newResult) {
    return (newResult - oldResult) / oldResult;
}

MongoClient.connect("mongodb://localhost:27017/evaluation").then((db) => {

    //db.collection("results").insert(results);

    //plotDetailedTransportDuration(db);
    //compareTransportDurations(db);
    plotDetailedTransportDuration2(db);

});

function compareTransportDurations(db) {
    function chartIt(howMany) {
        return query(db, { "condition.howMany": howMany }, { "transport": 1, "condition.latency": 1 })
            .then((results) => {
                analyzer.duration(results, `${__dirname}/duration_${howMany}.pdf`, "bla", "bla", "nla");
            })
    }

    chartIt(20);
    chartIt(60);
}


function fetchMultiplePerTransport(db, transport) {
    return query(db, { transport },{ "condition.latency": 1, "condition.howMany": 1 })
        .then((results) => {
            let series = {};

            results.forEach(r => {
                series[r.latency] = series[r.latency] ||
                    {
                        change: [],
                        durations: []
                    };

                if (series[r.latency].durations.length >= 1) {
                    series[r.latency].change.push(percChange(series[r.latency].durations.slice(-1)[0], r.duration));
                }

                series[r.latency].durations.push(r.duration);
            });

            console.log(inspect(series, { depth: null, colors: true }));

            return Object.keys(series).map(key => {
                return {
                    name: key,
                    data: series[key].durations
                }
            });
        });
}


function fetchMultiplePerTransport2(db, transport) {
    return query(db, { transport },{ "condition.howMany": 1, "condition.latency": 1 })
        .then((results) => {
            let series = {};

            results.forEach(r => {
                series[r.howMany] = series[r.howMany] ||
                    {
                        change: [],
                        durations: []
                    };

                if (series[r.howMany].durations.length >= 1) {
                    series[r.howMany].change.push(percChange(series[r.howMany].durations.slice(-1)[0], r.duration));
                }

                series[r.howMany].durations.push(r.duration);
            });

            console.log(inspect(series, { depth: null, colors: true }));

            return Object.keys(series).map(key => {
                return {
                    name: key,
                    data: series[key].durations
                }
            });
        });
}

function plotDetailedTransportDuration2(db) {
    const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];
    const categories = [20, 40, 60];

    Promise.all(transports.map(transport => {
        return fetchMultiplePerTransport2(db, transport)
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
                transport = transport.replace("/", "-");
                // transportDurationSingleTransport("Distribution: " + transport, __dirname + "/distribution_" + transport + ".pdf", categories, series);
            });
        });

}

function plotDetailedTransportDuration(db) {
    const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];
    const categories = [20, 40, 60];

    Promise.all(transports.map(transport => {
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
                transport = transport.replace("/", "-");
               // transportDurationSingleTransport("Distribution: " + transport, __dirname + "/distribution_" + transport + ".pdf", categories, series);
            });
        });

}

/*
 db.group(
 {
 ns: 'results',
 key: { condition: 1, 'result.duration': 1, 'pcap.dataSize': 1 },
 //cond: { ord_dt: { $gt: new Date( '01/01/2012' ) } },
 $reduce: function ( curr, result ) {
 result.total += curr.result.duration
 },
 initial: { total : 0 }
 });
 */