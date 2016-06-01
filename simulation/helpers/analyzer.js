"use strict";

const ss = require("simple-statistics");
const { LatexTable, chartTemplates, requestDurationDistribution } = require("../../helpers");
const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];

exports.duration = function (results, resultDir, tableCaption, tableLabel, chartName) {

    results.forEach((r) => {
        console.log(`${r.transport}  ${r.network} ${r.result.resources.length}`);
    });

    const tbl = new LatexTable({
        head: ["Transport", "Network", "Duration", "Number of packets", "Data size", "Average packet size"],
        caption: tableCaption,
        label: tableLabel
    });

    results.forEach((r) => {
        tbl.push([r.transport, r.network, parseFloat(r.duration).toFixed(2), r.pcap.numberOfPackets, r.pcap.dataSize, r.pcap.averagePacketSize]);
    });

    chartTemplates.transportDuration(chartName, `${resultDir}/duration.pdf`, results);
    console.log(tbl.toLatex());
};

/**
 * TODO make usable for multiple categories
 * 
 * @param results
 * @param resultDir
 * @param chartTitle
 */
exports.trafficSize = function(results, resultDir, chartTitle) {
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

    chartTemplates.trafficSize(chartTitle, resultDir, ["Uncompressed"], series);
};

exports.requestDistribution = function (results, resultDir) {
    const series = [[], [], [], [], [], []];

    //TODO sort by network
    //TODO Group by transport

    console.log(results);

    transports.map(transport => {
        let data = results
            .filter(r => r.transport === transport)
            .map((result) => {
                return {
                    name: result.network,
                    data: requestDurationDistribution(result.result.measures).map(e => {
                        return (e.count / (result.result.measures.length - 2)) * 100;
                    })
                };

            });

        /*
         [
            [ 30, 20, 20, 30 ], //0: 0,1,2,3
            [ 50, 20, 20, 30 ],
            [ 70, 20, 20, 30 ],
            [ 30, 20, 25, 25 ]
         ],


         [
            [30, 50, 70, 30, 20, 10], //0:0, 0:
            []
         ]
         */

        // 6 * 4 => 4 rows â 6 cols

        data = data
            .map(d => d.data);

        //TODO invert data
        console.log("before", transport, data);

        data.forEach((line, lineCount) => { //6
            line.forEach((col, colCount) => { //4
                //series[colCount][line]
                console.log(lineCount, colCount, col);
            });
        });

        //TODO invert data
        console.log("after", transport, data);

        transport = transport.replace("/", "-");

        //chartTemplates.requestDurationDistribution("Distribution", `${resultDir}/distribution_${transport}.pdf`,
        // ["2G", "3G", "4G", "DSL", "Cable", "Fibre"], series);
    });
    
    //chartTemplates.requestDurationDistribution(requestDurationDistribution(requests))

};