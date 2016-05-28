"use strict";

const sequest = require("sequest");
const { createWriteStream } = require("fs");

class TrafficSniffer {
    constructor(ssh = "application@192.168.99.100:22222") {
        this.seq = sequest(ssh);
    }

    start(port = 3001, filePath){
        this.seq.pipe(createWriteStream(filePath));
        this.seq.write(`tshark -i eth0 -o "ssl.keys_list: any,${port},http,/home/application/localhost.key" -f "tcp port ${port}" -F pcap -w -`);
    }

    stop() {
        this.seq.end()
    }
}

module.exports = TrafficSniffer;