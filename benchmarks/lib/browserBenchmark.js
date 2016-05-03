"use strict";

const wd = require("wd");
const guard = require("when/guard");
const fs = require("fs");

const asserters = wd.asserters;
const sequence = require("when/sequence");

function websiteBenchmark(url, browserName) {
    let results = {};

    const browser = wd.promiseRemote();

    return browser.init({ browserName })
        .then(() => browser.get(url))
        .then(() => browser.waitForElementByCss("img.word-picture-brand", asserters.isDisplayed, 2000))
        .then(() => browser.eval("window.performance.getEntries()"))
        .then((res) => {
            results.requests = res;
            results.requestCount = res.length;
        })
        .then(() => browser.eval("window.performance.timing"))
        .then((res) => { results.timing = res })
        .then(() => browser.eval("window.performance.timing.domContentLoadedEventEnd- window.performance.timing.navigationStart;"))
        .then((loadTime) => {
            console.log(url, browserName, results.requestCount, loadTime);
            //return loadTime;
            results.loadTime = loadTime;

            return browser.quit()
                .then(() => results);
        })
}

function apiBenchmark(url, browserName) {
    let requestCount = 0;
    let results = {};

    const browser = wd.promiseRemote();

    return browser
        .init({ browserName: browserName })
        .then(() => browser.setAsyncScriptTimeout(30000))
        .then(() => browser.get(url))
        .then(() => browser.waitForConditionInBrowser("window.benchDone === true", 10000))
        .then(() => browser.eval("window.performance.getEntries()"))
        .then((res) => {
            results.requests = res;
            results.requestCount = res.length;
        })
        .then(() => browser.eval("window.performance.timing"))
        .then((res) => { results.timing = res })
        .then(() => browser.eval("window.performance.timing.domContentLoadedEventEnd- window.performance.timing.navigationStart;"))
        .then((loadTime) => {
            console.log(url, browserName, requestCount, loadTime);
            //return loadTime;
            results.loadTime = loadTime;

            return browser.quit()
                .then(() => results);
        })
}

function benchSet(benchmarkFn, tries) {
    const benchmarkSet = new Array(tries).fill("");

    benchmarkFn = guard(guard.n(1), benchmarkFn);

    return Promise.all(
        benchmarkSet.map(() => benchmarkFn())
        )
        .then((results) => {
            let total = 0;

            results.forEach((res) => {
                total += res.loadTime;
            });

            return {
                total: (total / results.length).toFixed(2),
                results: results
            };
        });
}

function benchmark() {
    benchSet = guard(guard.n(1), benchSet);


    const benchies = [
        {
            name: "www-http2-ff",
            url: "https://vagrant.vm:2002/",
            browserName: "firefox",
            fn: websiteBenchmark
        },
        {
            name: "www-http1-ff",
            url: "https://vagrant.vm:2001/",
            browserName: "firefox",
            fn: websiteBenchmark
        },
        /*
        {
            name: "www-http2-chrome",
            url: "https://vagrant.vm:2002/",
            browserName: "chrome",
            fn: websiteBenchmark
        },
        {
            name: "www-http1-chrome",
            url: "https://vagrant.vm:2001/",
            browserName: "chrome",
            fn: websiteBenchmark
        },
        */
        {
            name: "api-http2-ff",
            url: "https://vagrant.vm:3002/",
            browserName: "firefox",
            fn: apiBenchmark
        },
        {
            name: "api-http1-ff",
            url: "https://vagrant.vm:3001/",
            browserName: "firefox",
            fn: apiBenchmark
        },
        /*
        {
            name: "api-http2-chrome",
            url: "https://vagrant.vm:3002/",
            browserName: "chrome",
            fn: apiBenchmark
        },
        {
            name: "api-http1-chrome",
            url: "https://vagrant.vm:3001/",
            browserName: "chrome",
            fn: apiBenchmark
        }
        */
    ];


    /*
    const benchies = [
        {
            name: "us-http2-ff",
            url: "https://54.183.96.250",
            browserName: "firefox",
            fn: websiteBenchmark
        },
        {
            name: "us-http1-ff",
            url: "https://54.153.31.183",
            browserName: "firefox",
            fn: websiteBenchmark
        },
        {
            name: "us-http2-chrome",
            url: "https://54.183.96.250",
            browserName: "chrome",
            fn: websiteBenchmark
        },
        {
            name: "us-http1-chrome",
            url: "https://54.153.31.183",
            browserName: "chrome",
            fn: websiteBenchmark
        }
    ];
    */

    return Promise.all(benchies.map((bench) => {
        return benchSet(() => bench.fn(bench.url, bench.browserName), 10)
            .then((res) => {
               res.name = bench.name;
               return res;
            })
    }));
}

var Table = require("cli-table");

// instantiate
var table = new Table({
    head: ['Test', 'LoadTime']
    , colWidths: [50, 50]
});

let dump = {};


benchmark()
    .then((res) => {
        res.forEach((entry) => {
            table.push([entry.name, entry.total]);

            dump[entry.name] = entry;
            //console.log(entry.results[0].requests, entry.results[0].timing)
        });

        console.log(table.toString());

        //console.log(dump);

        fs.writeFileSync(__dirname + "/results_" + Date.now() + ".json", JSON.stringify(dump, null, 2));

    })
    .catch((err) => console.error(err, err.stack));


process.on("unhandledRejection", (err) => console.error(err));