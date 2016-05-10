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
    head: ["Domain", "HTTP/2", "WebSockets", "Polling", "Long Polling", "Server-Sent Events"],
    colWidths: [20, 20, 20, 20, 20, 20],
    chars: texChars
});

const offlineTbl = new Table({
    head: ["Domain", "AppCache", "ServiceWorker", "LocalStorage", "SessionStorage", "IndexedDB"],
    colWidths: [35, 20, 20, 20, 20, 20],
    chars: texChars
});


const requestsTbl = new Table({
    head: ["Domain", "Total", "API", "Min", "Max", "Median", "Max Domain"],
    colWidths: [35, 10, 10, 10, 10, 10, 40],
    chars: texChars
});


function findByValue(arr, field, value) {
    return arr.filter((entry) => {
        if(entry[field] == value) {
            return entry;
        }
    })[0];
}

function analyzeRequests(requests, domain) {
    requests = requests.map((req) => {
        req.duration = parseInt(req.duration);
        return req;
    });


     /*
     Url {
     protocol: 'https:',
     slashes: true,
     auth: null,
     host: 'static.licdn.com',
     port: null,
     hostname: 'static.licdn.com',
     hash: null,
     search: null,
     query: null,
     pathname: '/sc/h/',
     path: '/sc/h/47j',
     href: 'https://static.licdn.com/sc/h/4u1isxjql2nskjds506r57zgp,e5zbo7jy9195flxuvyz0h2zjl,9ddpx3f38zululxuff5qms9fe,8edocauah45tnbjtbsti9wwc,aoy5buyx8suurwvmrz22am4u,arujd67wbm42utg760rtfzqz4,9nm4kj0n3xnmh85rgzq9ik8p1,b2nsnb9f0lrwmztpnz18nprsi,17y2agt9kijbm7edheybmlk34,acxtdmj2an5n7uae4ihl64nhz,91k1r7exn7166bm650hyqztqu,8ji1es152cj0sbpicso3u9ysr,6sj2lrdl7mklt5nfhdeipr25v,f1baat77jr9wgsdfqq9ucsche,7bxv1r0qjrzof2nop4amzk18k,661u8mflwj094zbr3ia766ip3,aj2hzaieyl5o1ke1ftq9ea83q' }
     */
    requests = requests
        .map((req) => {
            req.parsed = url.parse(req.name);

            const pathParts = req.parsed.path.split(".");

            if(pathParts.length < 2) {
                req.fileType = "api";
            }
            else {
                req.fileType = pathParts[pathParts.length-1];
            }

            return req;
        })
        .filter((req) => req.fileType === "json" || req.fileType === "api" || !req.fileType)
        .filter((req) => {
            if(!req.parsed.hostname) {
                return false;
            }

            //compare on hostname level
            const domainSplit = domain.split(".");
            domainSplit.splice(0, domainSplit.length - 2);

            const urlParts = req.parsed.hostname.split(".");
            req.baseUrl = urlParts[urlParts.length - 2] + "." + urlParts[urlParts.length - 1];

           return req.baseUrl === domainSplit.join(".");
        });

    const durations = requests.map((req) => req.duration);

    const timings = {
        count: durations.length,
        min: stats.min(durations),
        max: stats.max(durations),
        median: stats.median(durations),
        mean: stats.mean(durations),
        variance: stats.variance(durations),
        standardDeviation: stats.standardDeviation(durations)
    };
    const urls = {
        min: findByValue(requests, "duration", timings.min) || { parsed : {} } ,
        max: findByValue(requests, "duration", timings.max) || { parsed: {} }
    };

    if(requests.length === 0) {
        return {
            count: 0,
            timings: {
                min: 0,
                max: 0,
                median: 0
            },
            urls: {
                max: {
                    parsed: {
                        pathname: "",
                        hostname: ""
                    }
                }
            }
        };
    }

    return {
        count: requests.length,
        timings,
        urls,
        requests
    };
}

function formatRow(rows){
    return rows.map((elem, idx) => {
        if(idx === 0 || idx === 1) {
            return elem;
        }
        if (elem === false || elem === 0) {
            return "";
        }

        if(Number.isInteger(elem)) {
            return "\\checkmark (" + elem +")";
        }

        if (elem === true) {
            return "\\checkmark";
        }

        return "\\checkmark (" + elem + ")";
    });
}

console.log(Object.keys(results).length);

Object.keys(results)
    .forEach((key) => {
        const result = results[key];

        const requests = analyzeRequests(result.requests.client, key);

        transportsTable.push(formatRow([
            key,
            result.features.h2,
            result.features.websockets !== false,
            result.features.polling || false,
            result.features.longPolling || false,
            false
        ]));

        offlineTbl.push(formatRow([
            key,
            result.features.applicationCache,
            result.features.serviceWorker,
            result.features.localStorage,
            result.features.sessionStorage,
            result.features.indexedDBs && Object.keys(result.features.indexedDBs || {}).length
        ]));

        requestsTbl.push([
            key,
            result.requests.client.length,
            requests.count,
            requests.timings.min,
            requests.timings.median,
            requests.timings.max,
            requests.urls.max.parsed.hostname + "" + requests.urls.max.parsed.pathname
        ]);
    });

//console.log(transportsTable.toString());
//console.log(offlineTbl.toString());
console.log(requestsTbl.toString());
