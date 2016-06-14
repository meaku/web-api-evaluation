"use strict";

const { LatexTable } = require("../helpers");
const { writeFileSync } = require("fs");

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
        head: ["Requested Items", "Latency", "HTTP/1.1", "HTTP/2", "WebSocket"],
        caption,
        label
    });
    
    results.forEach(r => {
        tbl.push([r.howMany, r.latency, r["HTTP/1.1"], `${r["HTTP/2"]} (${r["HTTP/2_diff"]})` , `${r["WebSocket"]} (${r["WebSocket_diff"]})`]);
    });
    
    writeFileSync(fileName, tbl.toLatex());
}

exports.traffic = traffic;
exports.duration = duration;