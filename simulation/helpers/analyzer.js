"use strict";

const { LatexTable, chartTemplates } = require("../../helpers");

exports.duration = function(results, resultDir, tableCaption, tableLabel, chartName) {
   
    results.forEach((r) => {
        console.log(`${r.transport}  ${r.network} ${r.result.resources.length}`);
    });

    const tbl = new LatexTable({
        head: ["Transport", "Network", "Duration", "Number of packets", "Data size", "Average packet size"],
        caption: tableCaption,
        label: tableLabel
    });

    results.forEach((r) => {
        tbl.push([r.transport, r.network, r.duration,  r.pcap.numberOfPackets, r.pcap.dataSize, r.pcap.averagePacketSize]);
        console.log(`${r.transport}  ${r.network} ${r.duration} ${r.pcap.numberOfPackets} ${r.pcap.dataSize} ${r.pcap.averagePacketSize} ${r.pcap.captureDuration}`)
    });

    chartTemplates.transportDuration(chartName, `${resultDir}/duration.pdf`, results);
    console.log(tbl.toLatex());
};