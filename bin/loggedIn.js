"use strict";

const url = require("url");
const Table = require("cli-table");
const stats = require("simple-statistics");

const results = require("../results/loggedIn.json");
const helpers = require("./helpers");

const formatRow = helpers.formatRow([0, 1]);
const { filterByApi, filterByDomain, findByValue, analyzeRequestDestinations, texChars, preProcessRequests } = helpers;

const transportsTable = new Table({
    head: ["Domain", "HTTP/2", "WebSockets", "Polling", "Long Polling", "SSE"],
    colWidths: [20, 20, 20, 20, 20, 20],
    chars: texChars
});

const offlineTbl = new Table({
    head: ["Domain", "AppCache", "ServiceWorker", "LocalStorage", "SessionStorage", "IndexedDB"],
    colWidths: [35, 20, 20, 20, 20, 20],
    chars: texChars
});

const requestsTbl = new Table({
    head: ["Domain", "Requests", "Min", "Max", "Median", "\\sigma", "Max Domain"],
    colWidths: [35, 10, 10, 10, 20, 20, 40],
    chars: texChars
});

const requestDestinationsTable = new Table({
    head: ["Domain", "Overall", "Same Domain", "Overall: API", "Same Domain: API"],
    colWidths: [35, 20, 20, 20, 20],
    chars: texChars
});

function analyzeRequests(requests, domain) {
    requests = requests
        .map(preProcessRequests)
        .filter((req) => req.entryType !== "mark");
    
    const overallApiRequests = requests.filter(filterByApi);

    const sameDomainRequests = requests.filter(filterByDomain(domain));
    const sameDomainApiRequests = sameDomainRequests.filter(filterByApi);

    const durations = sameDomainApiRequests.map(req => req.duration);

    const destinations = {
        overallCount: requests.length,
        overallDomains: Object.keys(analyzeRequestDestinations(requests)).length,
        overallApiRequests: overallApiRequests.length,
        overallApiRequestsDomains: Object.keys(analyzeRequestDestinations(overallApiRequests)).length,
        sameDomainCount: sameDomainRequests.length,
        sameDomainDomains: Object.keys(analyzeRequestDestinations(sameDomainRequests)).length,
        sameDomainApiCount: sameDomainApiRequests.length,
        sameDomainApiDomains: Object.keys(analyzeRequestDestinations(sameDomainApiRequests)).length
    };

    const timings = {
        count: durations.length,
        min: stats.min(durations) || "-",
        max: stats.max(durations) || "-",
        median: stats.median(durations) || "-",
        mean: stats.mean(durations) || "-",
        variance: stats.variance(durations) || "-",
        standardDeviation: stats.standardDeviation(durations).toFixed(2) || "-"
    };

    const urls = {
        min: findByValue(sameDomainApiRequests, "duration", timings.min) || { parsed: {} },
        max: findByValue(sameDomainApiRequests, "duration", timings.max) || { parsed: {} }
    };

    return {
        destinations,
        timings,
        urls
    };
}

console.log("Total: " + Object.keys(results).length);

Object.keys(results)
    .forEach((domain) => {
        const result = results[domain];
        const requests = analyzeRequests(result.requests.client, domain);

        transportsTable.push(formatRow([
            domain,
            result.features.h2,
            result.features.websockets !== false,
            result.features.polling || false,
            result.features.longPolling || false,
            false
        ]));

        offlineTbl.push(formatRow([
            domain,
            result.features.applicationCache,
            result.features.serviceWorker,
            result.features.localStorage,
            result.features.sessionStorage,
            result.features.indexedDBs && Object.keys(result.features.indexedDBs || {}).length
        ]));
        
        requestsTbl.push([
            domain,
            requests.destinations.sameDomainApiCount,
            requests.timings.min,
            requests.timings.max,
            requests.timings.median,
            requests.timings.standardDeviation,
            requests.urls.max.parsed.hostname || "-"
        ]);
        
        requestDestinationsTable.push([
            domain,
            requests.destinations.overallCount + ` (${requests.destinations.overallDomains})`,
            requests.destinations.sameDomainCount + ` (${requests.destinations.sameDomainDomains})`,
            requests.destinations.overallApiRequests + ` (${requests.destinations.overallApiRequestsDomains})`,
            requests.destinations.sameDomainApiCount + ` (${requests.destinations.sameDomainApiDomains})`
        ]);
    });

console.log(transportsTable.toString());
console.log(offlineTbl.toString());
console.log(requestsTbl.toString());
console.log(requestDestinationsTable.toString());
