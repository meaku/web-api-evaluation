"use strict";

const url = require("url");
const Table = require("cli-table");
const stats = require("simple-statistics");

const results = require("../results/loggedIn.json");


const texChars = {
    'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
    , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
    , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
    , 'right': '\\\\', 'right-mid': '', 'middle': '&'
};

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
    head: ["Domain", "Requests", "Min", "Max", "Median", "Std Deviation", "Max Domain"],
    colWidths: [35, 10, 10, 10, 20, 20, 40],
    chars: texChars
});

const requestDestinationsTable = new Table({
    head: ["Domain", "Overall", "Same Domain", "Overall: API", "Same Domain: API"],
    colWidths: [35, 20, 20, 20, 20],
    chars: texChars
});

const apiFilter = (req) => req.fileType === "json" || req.fileType === "api" || !req.fileType;

function filterByDomain(domain) {
    return function (req) {
        const hostname = req.parsed.hostname;

        if (!hostname) {
            return false;
        }

        //compare on hostname level
        const domainSplit = domain.split(".");
        domainSplit.splice(0, domainSplit.length - 2);

        const urlParts = hostname.split(".");
        req.baseUrl = urlParts[urlParts.length - 2] + "." + urlParts[urlParts.length - 1];

        return req.baseUrl === domainSplit.join(".");
    }
}

function analyzeRequestDestinations(requests) {
    const domains = {};

    requests.forEach((req) => {
        const hostname = req.parsed.hostname;

        if (!domains[hostname]) {
            domains[hostname] = 1;
        }
        else {
            domains[hostname]++;
        }
    });

    return domains;
}


function findByValue(arr, field, value) {
    return arr.filter((entry) => {
        if (entry[field] == value) {
            return entry;
        }
    })[0];
}

function analyzeRequests(requests, domain) {
    requests = requests
    //determine file type by extension
        .map((req) => {
            req.duration = parseInt(req.duration);
            req.parsed = url.parse(req.name);

            const pathParts = req.parsed.path.split(".");

            if (pathParts.length === 1) {
                req.fileType = "api";
            }
            else {
                req.fileType = pathParts[pathParts.length - 1];
            }

            return req;
        })
        //remove performance marker
        .filter((req) => req.entryType !== "mark");


    const overallApiRequests = requests.filter(apiFilter);

    const sameDomainRequests = requests.filter(filterByDomain(domain));
    const sameDomainApiRequests = sameDomainRequests.filter(apiFilter);

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

function formatRow(rows) {
    return rows.map((elem, idx) => {
        if (idx === 0 || idx === 1) {
            return elem;
        }
        if (elem === false || elem === 0) {
            return "";
        }

        if (Number.isInteger(elem)) {
            return "\\checkmark (" + elem + ")";
        }

        if (elem === true) {
            return "\\checkmark";
        }

        return "\\checkmark (" + elem + ")";
    });
}

console.log("Total: " + Object.keys(results).length);

Object.keys(results)
    .forEach((domain) => {
        const result = results[domain];

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

        const requests = analyzeRequests(result.requests.client, domain);

        requestsTbl.push([
            domain,
            requests.destinations.sameDomainApiCount,
            requests.timings.min,
            requests.timings.max,
            requests.timings.median,
            requests.timings.standardDeviation,
            requests.urls.max.parsed.hostname || "-"
        ]);


        //head: ["Domain", "Overall", "Overall: API", "Same Domain", "Same Domain: API"]
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
