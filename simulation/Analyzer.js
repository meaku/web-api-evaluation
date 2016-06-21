"use strict";

const defaultHost = "mongodb://localhost:27017/evaluation";
const {
    transportDurationsXTransport,
    transportDurationPerTransport,
    requestDistributionXTransport,
    trafficXDataSize,
    trafficXPublishInterval,
    trafficXNumberOfPackets,
    pushDuration,
    uniqueItemsXLatency,
    uniqueItemsXPublishInterval
} = require("./plots");

const stats = require("simple-statistics");

const {
    traffic,
    duration,
    realtimeItemCount
} = require("./tables");

const _ = require("lodash");
const Promise = require("bluebird");
const mongodb = Promise.promisifyAll(require("mongodb"));
const fs = Promise.promisifyAll(require("fs"));
const MongoClient = mongodb.MongoClient;

function perc(n, o) {
    return (((n - o) / o) * 100).toFixed(2)
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
        return this.query({ "condition.latency": 80 }, { "condition.transport": 1, "condition.howMany": 1 })
            .then((results) => traffic({
                caption: "TCP Traffic",
                label: "table:tcp-traffic-" + this.collection,
                fileName: self.resultDir + "/traffic_table.tex"
            }, results));
    }

    tableDurations() {
        const self = this;
        return this.query({}, { "condition.transport": 1, "condition.howMany": 1, "condition.latency": 1 })
            .then((results) => {
                let final = {};

                results.forEach((r) => {
                    if (!final[r.howMany + "_" + r.latency]) {
                        final[r.howMany + "_" + r.latency] = {
                            howMany: r.howMany,
                            latency: r.latency
                        }
                    }

                    final[r.howMany + "_" + r.latency][r.transport + "_diff"] = perc(r.duration, final[r.howMany + "_" + r.latency]["HTTP/1.1"]);
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

        function plot(howMany) {
            return self.query({ "condition.howMany": howMany, "condition.latency": latency }, { "condition.transport": 1 })
                .then((results) => {
                    return requestDistributionXTransport({
                        fileName: `${self.resultDir}/distribution_${howMany}.pdf`
                    }, results);
                });
        }

        return Promise.all([
            plot(20),
            plot(100)
        ])
    }

    plotTTFI(howMany = 100) {
        const self = this;

        function plot(howMany) {
            return self.query({ "condition.howMany": howMany }, { "condition.transport": 1, "condition.latency": 1 })
                .then((results) => {
                    return results.map(result => {
                        let ttds = result.measures
                            .filter(m => m.name.indexOf("ttd") !== -1)
                            .map(m => m.duration);

                        return {
                            transport: result.transport,
                            latency: result.latency,
                            howMany: result.howMany,
                            min: stats.min(ttds),
                            max: stats.max(ttds),
                            mean: stats.mean(ttds),
                            median: stats.median(ttds)
                        };
                    });
                })
                .then(results => {
                    const result = results.map(r => {
                        return {
                            transport: r.transport,
                            latency: r.latency,
                            howMany: r.howMany,
                            duration: r.min
                        }
                    });

                    return transportDurationsXTransport({
                        fileName: `${self.resultDir}/ttfi_${howMany}.pdf`,
                        title: `Time to first item: ${howMany} Items`
                    }, result)
                });
        }

        return Promise.all([
            plot(20),
            plot(100)
        ])
    }
    
    plotMeanPublishTime(realtimeInterval, condition = {}) {
        const self = this;
        const conditions = { "condition.realtimeInterval": realtimeInterval };

        return this.query(
            Object.assign(conditions, condition),
            { "condition.transport": 1, "condition.latency": 1 }
        )
            .then(results => {
                return results.map(result => {
                    result.pollingInterval = result.pollingInterval / 1000;
                    result.realtimeInterval = result.realtimeInterval / 1000;

                    let durations = result.durations.map(r => r.duration);
                    result.uniqueCount = durations.length;
                    result.avgDuration = stats.mean(durations);

                    return result;
                });
            })
            .then(results => {
                results.forEach(result => {
                    console.log(result.transport, result.latency, result.realtimeInterval, ":", result.uniqueCount, result.avgDuration, result.dataSize)
                });

               return pushDuration({
                   fileName: `${self.resultDir}/push-duration-${realtimeInterval}.pdf`,
                   categories: [20, 640]
               }, results);
            });
    }

    plotUniqueItems(realtimeInterval, condition = {}) {
        const self = this;
        const conditions = { "condition.realtimeInterval": realtimeInterval };

        return this.query(
            Object.assign(conditions, condition),
            { "condition.transport": 1, "condition.latency": 1 }
        )
            .then(results => {
                return results.map(result => {
                    let durations = result.durations.map(r => r.duration);
                    result.uniqueCount = durations.length;
                    result.avgDuration = stats.mean(durations);
                    return result;
                });
            })
            .then(results => {
                results.forEach(result => {
                    console.log(result.transport, result.latency, result.realtimeInterval, ":", result.uniqueCount, result.avgDuration, result.dataSize)
                });

                return uniqueItemsXLatency({
                    fileName: `${self.resultDir}/uniqueItems-${realtimeInterval}_${condition["condition.pollingInterval"] || ""}.pdf`,
                    categories: [20, 640]
                }, results);
            });
    }

    plotUniqueItemsXPublishInterval(latency, condition = {}) {
        const self = this;
        const conditions = { "condition.latency": latency };
        let pollInterval = condition["condition.pollingInterval"] || false;

        return this.query(
            Object.assign(conditions, condition),
            { "condition.realtimeInterval": 1, "condition.transport": 1 }
        )
            .then(results => {
                return results.map(result => {
                    let durations = result.durations.map(r => r.duration);
                    result.uniqueCount = durations.length;
                    return result;
                });
            })
            .then(results => {
                return uniqueItemsXPublishInterval({
                    fileName: `${self.resultDir}/uniqueItems-interval_${latency}_${pollInterval || ""}.pdf`,
                    categories: [1, 5, 10, 30]
                }, results);
                
            });
    }

    /*
    plotTrafficXPublishInterval(latency, condition = {}) {
        const self = this;
        const conditions = { "condition.latency": latency };
        let pollInterval = condition["condition.pollingInterval"] || false;

        return this.query(
            Object.assign(conditions, condition),
            { "condition.realtimeInterval": 1, "condition.transport": 1 }
        )
            .then(results => {
                return results.map(result => {
                    let durations = result.durations.map(r => r.duration);
                    result.uniqueCount = durations.length;
                    return result;
                });
            })
            .then(results => {
                return trafficXPublishInterval({
                    fileName: `${self.resultDir}/traffic-interval_${latency}_${pollInterval || ""}.pdf`,
                    categories: [1, 5, 10, 30]
                }, results);
            });
    }
    */

    plotRTTraffic(pollingInterval) {
        const self = this;
        const condition = { "condition.latency": 20 };

        if(pollingInterval) {
            condition["condition.pollingInterval"] = pollingInterval;
        }

        return this.query(condition, { "condition.realtimeInterval": 1, "condition.transport": 1 })
            .then(result => {
                return trafficXPublishInterval(
                    { fileName: `${self.resultDir}/traffic_${pollingInterval || ""}_dataSize.pdf` },
                    result
                )
            });
    }
    
    tablePollingDurations(transport, condition = {}) {
        const self = this;

        let conditions = { transport, "condition.realtimeInterval": 10000 };
        
        return this.query(
            Object.assign(conditions, condition),
            { "condition.latency": 1, "condition.realtimeInterval": 1, "condition.pollingInterval": 1}
        )
            .then(results => {
                return results.map(result => {
                    result.pollingInterval = result.pollingInterval / 1000;
                    result.realtimeInterval = result.realtimeInterval / 1000;

                    return result;
                });
            })
            .then(results => {
                realtimeItemCount({
                    fileName: `${self.resultDir}/polling_durations_${transport.replace("/", "-")}.tex`,
                    caption: `Polling Durations: ${transport}`
                }, results);
            });
    }
}

module.exports = Analyzer;
