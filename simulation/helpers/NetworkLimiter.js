"use strict";

const sequest = require("sequest");

function log() {
    console.log.apply(this, arguments);
}

class NetworkLimiter {
    constructor(ssh = "application@ec2-54-93-72-83.eu-central-1.compute.amazonaws.com:22222") {
        this.connection = sequest.connect(ssh);
    }

    _exec(cmd) {
        return new Promise((resolve, reject) => {
            this.connection(cmd, (e, stdout) => {
                if(e) {
                    return reject(e);
                }

                resolve(stdout);
            });
        });
    }
    
    throttle(latency = "10ms", bandwidth = "100Mbit") {
        if(latency === false) {
            return this.reset();
        }

        latency += "ms";

        log(`Limit latency: ${latency}`);

        return this.reset()
            .then(() => this._exec(`sudo tc qdisc add dev eth1 root netem delay ${latency}`));
    }

    reset() {
        return this._exec("sudo tc qdisc del dev eth1 root")
            .catch(err => {
                //ignore: there are no existing rules defined for qdisc
                return Promise.resolve();
            });
    }
}

module.exports = NetworkLimiter;

