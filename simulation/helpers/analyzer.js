"use strict";

const ss = require("simple-statistics");
const { LatexTable, chartTemplates, requestDurationDistribution } = require("../../helpers");
const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];

exports.duration = function (results, outputPath, tableCaption, tableLabel, chartName) {

    results.forEach((r) => {
        console.log(`${r.transport}  ${r.latency}`);
    });

    const tbl = new LatexTable({
        head: ["Transport", "Network", "Duration", "Number of packets", "Data size", "Average packet size"],
        caption: tableCaption,
        label: tableLabel
    });

    results.forEach((r) => {
        tbl.push([r.transport, r.latency, parseFloat(r.duration).toFixed(2), r.numberOfPackets, r.dataSize, r.averagePacketSize]);
    });

    chartTemplates.transportDuration(chartName, outputPath, results);
    console.log(tbl.toLatex());
};

/**
 * TODO make usable for multiple categories
 * 
 * @param results
 * @param resultDir
 * @param chartTitle
 */
exports.trafficSize = function({ results, resultDir, chartTitle, yMax, xMax }) {
    //TODO should be part of simulation logic
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

    let trafficResults = results.map(r => {
        return Object.assign({
            transport: r.transport,
            network: r.network
        }, parseTraffic(r.pcap));
    });

    trafficResults = transports.map(t => {
        const perTransport = trafficResults
            .filter(r => r.transport === t);

        return {
            transport: t,
            averageSize: ss.average(perTransport.map(r => r.dataSize)),
            results: perTransport
        }

    });

    const series = trafficResults
        .map(res => {
            return {
                name: res.transport,
                data: [res.averageSize]
            }
        });

    chartTemplates.trafficSize({ title: chartTitle, fileName: resultDir, categories: ["Uncompressed"], series, yMax, xMax });
};

exports.requestDistribution = function (results, resultDir) {
    const series = [[], [], [], [], [], []];

    //TODO sort by network
    //TODO Group by transport

    //console.log(results);

    transports.map(transport => {

        results = results
            .filter(r => r.transport === transport)
            .map((result) => {

                return requestDurationDistribution(result.measures).map(dist => {
                    return {
                        network: result.network,
                        name: dist.name,
                        count: dist.count,
                        percent: dist.count / result.measures.length

                }})
            });

        console.log(results);

        transport = transport.replace("/", "-");

        //chartTemplates.requestDurationDistribution("Distribution", `${resultDir}/distribution_${transport}.pdf`, [], results);
        // ["2G", "3G", "4G", "DSL", "Cable", "Fibre"], series);
    });
    
    //chartTemplates.requestDurationDistribution(requestDurationDistribution(requests))

};