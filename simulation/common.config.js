"use strict";

const path = require("path");

exports.defaultNetworks = {
    ///*
    "2G": {
        latency: "650ms",
        bandwidth: "200kbits"
    },
    "3G": {
        latency: "300ms",
        bandwidth: "2mbits"
    },
    "4G": {
        latency: "100ms",
        bandwidth: "10mbits"
    },
    "DSL": {
        latency: "35ms",
        bandwidth: "25mbits"
    },
    //*/
    "Cable": {
        latency: "20ms",
        bandwidth: "50mbits"
    },
    "Fibre": {
        latency: "10ms",
        bandwidth: "100mbits"
    }
};

exports.hosts = {
    h1: "https://192.168.99.100:3001",
    h2: "https://192.168.99.100:3002"
};

exports.resultsDir = path.resolve(__dirname, "../results/simulation");