"use strict";

const defaultHost = "mongodb://localhost:27017/evaluation";
const {
    transportDurationsXTransport,
    transportDurationPerTransport,
    trafficXDataSize,
    trafficXNumberOfPackets
} = require("./plots");

const Promise = require("bluebird");
const mongodb = Promise.promisifyAll(require("mongodb"));
const fs = Promise.promisifyAll(require("fs"));
const MongoClient = mongodb.MongoClient;

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
        console.log(resultFile);
        return this.truncate()
            .then(() => require(resultFile).transports)
            .then((results) => this.insert(results));
    }

    truncate() {
        return this.db.collection(this.collection).remove({});
    }

    insert(results) {
        console.log(this.collection, results);
        return this.db.collection(this.collection).insert(results)
    }

    query(condition = {}, sort = {}) {
        return this.db.collection(this.collection)
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
        const transports = ["HTTP/1.1", "HTTP/2", "Websocket"];
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
}

module.exports = Analyzer;
