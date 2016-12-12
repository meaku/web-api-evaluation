"use strict";

const sequest = require("sequest");
const { createWriteStream } = require("fs");
const stream = require("stream");

/**
 * sets a timeout depending on throughput
 * emits "writeFinished" event if no data is pending
 *
 * @returns {Object}
 */
function waitForData() {
    function finito() {
        console.log("finito");
        writable.emit("writeFinished");
    }

    const writable = new stream.Writable({
        write: function(chunk, encoding, next) {
            if(this.timeout) {
                clearTimeout(this.timeout);
            }

            this.timeout = setTimeout(finito, 5000);
            next();
        }
    });

    return writable;
}

class TrafficSniffer {
    constructor(ssh = "application@192.168.99.100:22222") {
        this.seq = sequest(ssh);
        this.isReady = new Promise((resolve) => {
            this.seq.connection.on("ready", () => resolve());
        });
    }

    start(port = 3001, filePath){
        const self = this;

        if(port === false) {
            return Promise.resolve();
        }

        this.dataWritten = new Promise(resolve => {
            const dataWritten = waitForData();
            self.seq.pipe(dataWritten);

            dataWritten.on("writeFinished", () =>  {
                self.seq.unpipe(dataWritten);
                resolve();
            });
        });

        this.seq.pipe(createWriteStream(filePath));
        this.seq.write(`tshark -i eth1 -f "tcp port ${port}" -F pcap -w -`);
        //this.seq.write(`tshark -i eth0 -o "ssl.keys_list: any,${port},http,/home/application/localhost.key" -f "tcp port ${port}" -F pcap -w -`);
        return this.isReady;
    }

    stop() {
        return this.dataWritten.then(() => this.seq.end());
    }
}

module.exports = TrafficSniffer;