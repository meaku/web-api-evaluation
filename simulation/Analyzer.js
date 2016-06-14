"use strict";

const defaultHost = "mongodb://localhost:27017/evaluation";
const {
    transportDurationsXTransport,
    transportDurationPerTransport,
    requestDistributionXTransport,
    trafficXDataSize,
    trafficXNumberOfPackets
} = require("./plots");

const {
    traffic,
    duration
} = require("./tables");

const _ = require("lodash");
const Promise = require("bluebird");
const mongodb = Promise.promisifyAll(require("mongodb"));
const fs = Promise.promisifyAll(require("fs"));
const MongoClient = mongodb.MongoClient;

function perc(n, o) {
    return ((n - o)/o).toFixed(2)
}

Promise.promisifyAll(mongodb.Cursor.prototype);

class Analyzer {
    constructor(collection, resultDir) {
        this.collection = collection;
        this.resultDir = resultDir;
    }

    connect(host = defaultHost) {
        const self = this;
        return MongoClient.connect(host)
            .then(db => self.db = db);
    }

    updateResults(resultFile) {
        return this.truncate()
            .then(() => require(resultFile).transports)
            .then((results) => this.insert(results));
    }

    truncate() {
        return this.db.collection(this.collection).remove({});
    }

    insert(results) {
        return this.db.collection(this.collection).insert(results)
    }

    query(condition = {}, sort = {}, collection) {
        collection = collection || this.collection;
        return this.db.collection(collection)
            .find(condition)
            .sort(sort)
            .toArray()
            .then((res) => res.map(r => Object.assign(r.result, r.condition, r.pcap)));
    }

    /**
     * plot durations for 20, 60 and 100 requests
     *
     * @returns {*|Promise}
     */
    plotDurations() {
        const self = this;

        function plot(howMany) {
            return self.query({ "condition.howMany": howMany }, { "transport": 1, "condition.latency": 1 })
                .then((result) => {
                    return transportDurationsXTransport({
                        fileName: `${self.resultDir}/durations_${howMany}.pdf`,
                        title: `Load Time: ${howMany} Items`
                    }, result)
                });
        }

        return Promise.all([20, 60, 100]).map(plot);
    }

    plotTraffic() {
        const self = this;

        return this.query({ "condition.latency": 80 }, { "condition.howMany": 1, "transport": 1 })
            .then(result => {
                return Promise.all([
                    trafficXDataSize(
                        { fileName: `${self.resultDir}/traffic_dataSize.pdf` },
                        result
                    ),
                    trafficXNumberOfPackets(
                        { fileName: `${self.resultDir}/traffic_packets.pdf` },
                        result
                    )
                ]);
            })
    }

    plotDurationPerTransport() {
        const self = this;
        const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];
        const categories = [20, 40, 60, 80, 100];

        return Promise.all(
            transports
                .map(transport => {
                    return self.query({ transport }, { "condition.latency": 1, "condition.howMany": 1 })
                        .then((results) => {
                            return transportDurationPerTransport({
                                categories,
                                transport,
                                resultDir: self.resultDir
                            }, results);
                        })
                })
        );
    }

    tableTrafficData() {
        const self = this;
        return this.query({ "condition.latency": 80 }, { "condition.transport": 1, "condition.howMany": 1})
            .then((results) => traffic({
                caption: "TCP Traffic",
                label: "table:tcp-traffic-" + this.collection,
                fileName: self.resultDir + "/traffic_table.tex"
            }, results));
    }
    
    tableDurations() {
        const self = this;
        return this.query({}, { "condition.transport": 1, "condition.howMany": 1})
            .then((results) => {
                let final = {};

                results.forEach((r) => {
                    if(!final[r.howMany + "_" + r.latency]) {
                        final[r.howMany + "_" + r.latency]= {
                            howMany: r.howMany,
                            latency: r.latency
                        }
                    }

                    final[r.howMany + "_" + r.latency][r.transport + "_diff"] = perc(r.duration, final[r.howMany + "_" + r.latency]['HTTP/1.1']);
                    final[r.howMany + "_" + r.latency][r.transport] = r.duration.toFixed(2);
                });

                final = _.flatten(Object.keys(final).map(key => final[key]));

                return duration({
                    caption: "Load Time",
                    label: "table:load-time-" + this.collection,
                    fileName: self.resultDir + "/durations_table.tex"
                }, final);
            });
    }

    plotDistribution(howMany = 100, latency = 640) {
        const self = this;

        return this.query({  "condition.howMany": howMany, "condition.latency": latency }, { "condition.transport": 1 })
            .then((results) => {
                return requestDistributionXTransport({
                    filePath: self.resultDir
                }, results);
            });
    }
}

module.exports = Analyzer;
