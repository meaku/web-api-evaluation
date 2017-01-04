"use strict";

const { exec } = require("child_process");

/**
 * remove units 
 * @param r
 * @returns {{dataSize: Number, averagePacketRate: Number, averagePacketSize: Number, numberOfPackets: Number, dataBitRate: Number}}
 */
function parseTraffic(r) {
    const [size] = r.dataSize.split(" ");
    const [averagePacketSize] = r.averagePacketSize.split(" ");
    const [averagePacketRate] = r.averagePacketRate.split(" ");
    const [dataBitRate] = r.dataBitRate.split(" ");

    /*
     { numberOfPackets: '63',
     dataSize: '40 bytes',
     captureDuration: '6.980352 seconds',
     averagePacketSize: '647,24 bytes',
     averagePacketRate: '9 packets/s',
     dataBitRate: '46 bits/sec' }
     */
    return {
        dataSize: (parseInt(size) / 1000).toFixed(),
        averagePacketRate: parseInt(averagePacketRate),
        averagePacketSize: parseInt(averagePacketSize) / 1000,
        numberOfPackets: parseInt(r.numberOfPackets),
        dataBitRate: parseInt(dataBitRate)
    }
}

/**
 * extract data from pcap using capinfos
 *
 * @param path
 * @returns {Promise}
 */
function analyzePcap(path) {
    const cmd = `capinfos -M ${path}`;

    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout) => {
            if (err) {
                return reject(err);
            }

            const res = {};

            stdout.split("\n").forEach((line) => {
                const parts = line.split(":");
                res[parts[0]] = parts[parts.length - 1];
            });

            resolve(parseTraffic({
                numberOfPackets: res["Number of packets"].trimLeft(),
                dataSize: res["Data size"].trimLeft(),
                captureDuration: res["Capture duration"].trimLeft(),
                averagePacketSize: res["Average packet size"].trimLeft(),
                averagePacketRate: res["Average packet rate"].trimLeft(),
                dataBitRate: res["Data bit rate"].trimLeft()
            }));
        });
    });
}

module.exports = analyzePcap;