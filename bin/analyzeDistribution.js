"use strict";

const Table = require("cli-table");
const url = require("url");
const results = require("../results/top100_techDistribution.json");
const top100domains = require("../data/top100Wikipedia.json").map((entry) => entry.domain);
const formatRow = require("./helpers").formatRow;
const helpers = require("./helpers");
const { filterByApi, filterByDomain, texChars, preProcessRequests, addStatsRow } = helpers;

const table = new Table({
    head: ["Domain", "H2", "WS", "SSE", "SW", "AC", "LS", "SS", "IDB"],
    colWidths: [30, 20, 20, 20, 20, 20, 20, 20, 20],
    chars: texChars
});

//responseHeaders["content-type"] text/event-stream

function filterRequests(requests, domain) {
    const res = {};

    const mergedRequestTable = new Table({
        head: ["Url", "Method", "Duration", "Size", "Type"],
        colWidths: [60, 15, 10, 10, 30],
        chars: texChars
    });

    //TODO set by proxy
    requests.server = requests.server.map((req) => {
        if (!req.contentType) {
            req.contentType = "unknown";
        }

        return req;
    });

    const SSECount = requests.server.filter((req) => {
        return req.contentType.indexOf("text/event-stream") !== -1
    });

    res.clientXhr = requests.client
        .filter(req => req.initiatorType === "xmlhttprequest" || req.initiatorType === "")
        .map(preProcessRequests)
        .filter(filterByDomain(domain))
        .filter(filterByApi)
        .map((req) => {
            return {
                url: req.name,
                duration: req.duration
            };
        });


    res.matchingRequests = res.clientXhr
        .map((req) => requests.server.filter(serverRequest => serverRequest.url === req.url)[0] || {})
        .filter((res) => res.contentType.indexOf("text") !== -1 || res.contentType.indexOf("application") !== -1)
        .forEach((res) => {
            mergedRequestTable.push([
                res.url,
                res.method || "",
                res.duration || "",
                res.contentLength || "",
                res.contentType || ""
            ]);
        });
    console.log(mergedRequestTable.toString());

    return res;
}

//["Domain", "H2", "WS", "SSE", "SW", "AC", "LS", "SS", "IDB"],
Object.keys(results)
    .forEach((key) => {
        const result = results[key];
        table.push(formatRow()([
            key,
            result.features.h2,
            result.features.websockets !== false,
            result.features.sse,
            result.features.serviceWorker,
            result.features.applicationCache,
            result.features.localStorage,
            result.features.sessionStorage,
            Object.keys(result.features.indexedDBs).length
        ]));

        filterRequests(result.requests, key);
    });

table.push(addStatsRow(table).map(stats => stats.percent));

console.log(table.toString());

const checkedDomains = Object.keys(results);
const skippedUrls = top100domains.filter((domain) => checkedDomains.indexOf(domain) === -1);

console.log(`Checked: ${checkedDomains.length}, skipped ${skippedUrls.length}: ${skippedUrls.join(", ")}`);
