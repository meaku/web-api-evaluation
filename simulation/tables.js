"use strict";

const { LatexTable } = require("../helpers");
const { writeFileSync } = require("fs");
const stats = require("simple-statistics");

function traffic(config, results) {
    const { caption, label, fileName } = config;
    const tbl = new LatexTable({
        head: ["Transport", "Requested Items", "Data Size (kB)", "Packets", "Average Packet Size (kB)"],
        caption,
        label
    });
    
    results.forEach(r => {
        console.log([r.transport, r.howMany, r.dataSize, r.numberOfPackets, r.averagePacketSize]);
        tbl.push([r.transport, r.howMany.toString(), r.dataSize, r.numberOfPackets, r.averagePacketSize]);
    });
    
    writeFileSync(fileName, tbl.toLatex());
}

function duration(config, results) {
    const { caption, label, fileName } = config;
    
    const tbl = new LatexTable({
        head: ["Requested Items", "Latency", "HTTP/1.1", "HTTP/2", "Diff H1", "WebSocket", "Diff H1"],
        caption,
        label
    });
    
    results.forEach(r => {
        tbl.push([r.howMany, r.latency, r["HTTP/1.1"], r["HTTP/2"], r["HTTP/2_diff"], r["WebSocket"], r["WebSocket_diff"]]);
    });
    
    writeFileSync(fileName, tbl.toLatex());
}

function realtimeItemCount(config, results) {
    const { caption, label, fileName } = config;

    const tbl = new LatexTable({
        head: ["Latency", "Publish Interval", "Poll Interval", "Unique Responses", "Avg. Duration", "Min", "Max", "Traffic"],
        caption,
        label
    });

    results.forEach(r => {
        let durations = r.durations.map(r => r.duration);
        
        //maybe no polling interval for reuse?
        tbl.push([r.latency, r.realtimeInterval, r.pollingInterval, r.durations.length, stats.mean(durations).toFixed(2), stats.min(durations), stats.max(durations), r.dataSize]);
    });

    writeFileSync(fileName, tbl.toLatex());

}

exports.realtimeItemCount = realtimeItemCount;
exports.traffic = traffic;
exports.duration = duration;