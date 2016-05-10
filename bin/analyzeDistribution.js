"use strict";

const Table = require("cli-table");
const results = require("../results/top100_techDistribution.json");
const top100domains = require("../data/top100Wikipedia.json").map((entry) => entry.domain);

const texChars = {
    'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
    , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
    , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
    , 'right': '\\\\', 'right-mid': '', 'middle': '&'
};

const table = new Table({
    head: ["Domain", "WebSockets", "SSE", "SW", "ls", "ss", "idb", "appcache"],
    colWidths: [30, 20, 20, 20, 20, 20, 20, 20],
    chars: texChars
});

function filterRequests(requests) {
    const res = {};

    const requestTable = new Table({
        head: ["Url", "Duration", "Type", "Content-Type"],
        colWidths: [50, 15, 10],
        chars: texChars
    });

    const mergedRequestTable = new Table({
        head: ["Url", "Method", "Duration", "Size", "Type"],
        colWidths: [60, 15, 10, 10, 30],
        chars: texChars
    });

    //set in proxy
    requests.server = requests.server.map((req) => {
        if (!req.contentType) {
            req.contentType = "unknown";
        }

        return req;
    });

    res.clientXhr = requests.client
        .filter(req => req.initiatorType === "xmlhttprequest" || req.initiatorType === "")
        .map((req) => {
            requestTable.push([req.name, req.duration, "client", req.initiatorType]);

            return {
                url: req.name,
                duration: req.duration
            };
        });

    res.serverJson = requests.server
        .filter(req => req.contentType.indexOf("application/json") !== -1)
        .map((req) => {
            requestTable.push([req.url, req.duration, "server", req.contentType]);
            return {
                url: req.url,
                duration: req.duration,
                contentType: req.contentType
            };
        });


    res.matchingRequests = res.clientXhr.map((req) => {

        return requests.server.filter(serverRequest => serverRequest.url === req.url)[0] || {};

        /*
        const res = {
            url: req.url,
            method: matchingServerResponse.method,
            contentLength: matchingServerResponse.contentLength,
            contentType: matchingServerResponse.contentType,
            duration: req.duration
        };
        */


    });

    res.matchingRequests = res.matchingRequests.filter((res) => {
        return res.contentType.indexOf("text") !== -1 || res.contentType.indexOf("application") !== -1;
    });

    res.matchingRequests.forEach((res) => {
        mergedRequestTable.push([res.url, res.method || "", res.duration || "", res.contentLength || "", res.contentType || ""]);
    });


    //console.log(requestTable.toString());
    console.log(mergedRequestTable.toString());

    return res;
}

Object.keys(results)
    .forEach((key) => {
        const result = results[key];

        table.push([
                key,
                result.features.websockets !== false,
                result.features.sse,
                result.features.serviceWorker,
                result.features.localStorage,
                result.features.sessionStorage,
                result.features.indexedDBs.length > 0,
                result.features.applicationCache
        ]);

        const lastIndex = table.length - 1;

        table[lastIndex] = table[lastIndex].map((elem) => {
            if (elem === false || elem === 0) {
                return "";
            }

            if(Number.isInteger(elem)) {
                return "\\checkmark (" + elem +")";
            }

            if (elem === true) {
                return "\\checkmark";
            }

            return elem;
        });

        console.log("\n", "Domain: ", key);
        const reqs = filterRequests(result.requests);
    });

console.log(table.toString());

const checkedDomains = Object.keys(results);

const skippedUrls = top100domains.filter((domain) => checkedDomains.indexOf(domain) === -1);

console.log(`Checked: ${checkedDomains.length}, skipped ${skippedUrls.length}: ${skippedUrls.join(", ")}`);
