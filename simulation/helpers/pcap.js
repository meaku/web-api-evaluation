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
     dataSize: '40 kB',
     captureDuration: '6.980352 seconds',
     averagePacketSize: '647,24 bytes',
     averagePacketRate: '9 packets/s',
     dataBitRate: '46 kbps' }
     */
    return {
        dataSize: parseInt(size),
        averagePacketRate: parseInt(averagePacketRate),
        averagePacketSize: parseInt(averagePacketSize),
        numberOfPackets: parseInt(r.numberOfPackets),
        dataBitRate: parseInt(dataBitRate)
    }
}

/**
 * extract data from pcap using capinfos
 * TODO refactor using the table format
 *
 * @param path
 * @returns {Promise}
 */
function analyzePcap(path) {
    const cmd = `capinfos ${path}`;

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

            /*
             { numberOfPackets: '63',
             dataSize: '40 kB',
             captureDuration: '6.980352 seconds',
             averagePacketSize: '647,24 bytes',
             averagePacketRate: '9 packets/s',
             dataBitRate: '46 kbps' }
             */

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