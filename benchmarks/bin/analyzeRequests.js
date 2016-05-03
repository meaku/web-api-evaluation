"use strict";

const fs = require("fs");
const Table = require("cli-table");
const ss = require("simple-statistics");
const glob = require("glob-promise");

const results = require("./results_1461009122503.json");


const texChars = { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
    , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
    , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
    , 'right': '\\\\' , 'right-mid': '' , 'middle': '&' };

glob('results/*.json', { nobrace: true })
    .then(function(contents) {
        contents.forEach((content) => {
            fs.readFile(__dirname + `/${content}`, (err, res) => {
                if(err){
                    throw err;
                }

                analyzeRequest(content, JSON.parse(res));
            });
        })
    });

function analyzeRequest(name, results) {
    console.log(name  + "\n");

    const requestsTable = new Table({
        head: ["Benchmark", "Protocol", "Browser", "min (total)", "avg (total)", "max (total)", "min (reqs)", "avg(reqs)", "max(reqs)"]
        , colWidths: [10, 10, 10, 10, 10, 10, 10, 10, 10]
        //chars: texChars
    });

    Object.keys(results).forEach((name) => {
        let bench = results[name];
        const totalDurations = extractField(bench.results, "loadTime");

        let statsTotal = {
            mean: ss.mean(totalDurations),
            max: ss.max(totalDurations),
            min: ss.min(totalDurations)
        };

        const mergedRequests = mergeRequestSamples(extractField(bench.results, "requests")[0]);
        const durations = extractField(mergedRequests, "duration");

        let requestsDurations = {
            mean: ss.mean(durations),
            max: ss.max(durations),
            min: ss.min(durations)
        };

        let nameSplit = splitName(name);

        requestsTable.push([
            nameSplit.type,
            nameSplit.protocol,
            nameSplit.browser,
            statsTotal.min.toFixed(2),
            statsTotal.mean.toFixed(2),
            statsTotal.max.toFixed(2),
            requestsDurations.min.toFixed(2),
            requestsDurations.mean.toFixed(2),
            requestsDurations.max.toFixed(2)
        ]);

        console.log(`${name}: ${findByValue(mergedRequests, durations, requestsDurations.min).name}, ${findByValue(mergedRequests, durations, requestsDurations.max).name}`)
    });

    console.log(requestsTable.toString());

}

function mergeRequestSamples(requests) {
    const overall = {};

    requests.forEach((req) => {
        if (!overall[req.name]) {
            overall[req.name] = req;
            overall[req.name].count = 1;
            return;
        }

        overall[req.name].duration += req.duration;
        overall[req.name].count++;
    });

    return Object.keys(overall).map((name) =>  {
        overall[name].duration = overall[name].duration / overall[name].count;
        return overall[name];
    });
}

function extractField(arr, fieldName) {
    return arr.map((entry) => entry[fieldName]);
}

function findByValue(results, arr, value) {
    return results[arr.indexOf(value)];
}

function logRequests(bench) {
    bench.results.forEach((result) => {
        const requests = result.requests;

        const requestsTable = new Table({
            head: ["Name", "LoadTime", "protocol"]
            , colWidths: [50, 50, 50]
        });

        requests.forEach((request) => {
            requestsTable.push([request.name, request.duration, request.nextHopProtocol]);
        });

        const durations = extractField(requests, "duration");

        let details = {
            mean: ss.mean(durations),
            max: ss.max(durations),
            min: ss.min(durations)
        };


        console.log(`Min ${details.min} ${findByValue(requests, durations, details.min).name}`);
        console.log(`Mean ${details.mean}`);
        console.log(`Max ${details.max} ${findByValue(requests, durations, details.max).name}`);

        console.log(requestsTable.toString());
    });
}

function splitName(name) {
    const split = name.split("-");

    let benchType = split[0];
    let protocol = split[1];
    let browser = split[2];

    return {
        browser: browser === "ff" ? "Firefox" : "Chrome",
        protocol:  protocol === "http2" ? "HTTP/2" : "HTTP/1.1",
        type: benchType === "www" ? "Website" : "API"
    };
}
