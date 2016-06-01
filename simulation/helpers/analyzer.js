"use strict";

const { LatexTable, chartTemplates, requestDurationDistribution } = require("../../helpers");

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

exports.requestDistribution = function (results, resultDir) {
    const transports = ["HTTP/1.1", "HTTP/2", "WebSocket"];
    const series = [];
    
    //TODO sort by network
    //TODO Group by transport

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


        data = data
            .map(d => d.data);

        //TODO invert data

        transport = transport.replace("/", "-");

        //chartTemplates.requestDurationDistribution("Distribution", `${resultDir}/distribution_${transport}.pdf`,
        // ["2G", "3G", "4G", "DSL", "Cable", "Fibre"], series);
    });
    //chartTemplates.requestDurationDistribution(requestDurationDistribution(requests))

};