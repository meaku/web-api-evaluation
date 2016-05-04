"use strict";

const fs = require("fs");
const path = require("path");

var webdriver = require("selenium-webdriver"),
    chrome = require("selenium-webdriver/chrome");

const initProxy = require("../proxy/proxy");

const websites = require("../data/top100Wikipedia.json").map((website) => website.domain);

/*
const websites = [
    "nytimes.com",
    "twitter.com",
    "github.com",
    "facebook.com",
    "youtube.com",
    "instagram.com",
    "web.whatsapp.com",
    //"play.spotify.com"
];
*/

//const websites = ["heise.de", "play.spotify.com"];
//console.log(topWebsites);


function runTest(domain) {
    const proxy = initProxy({
        domain,
        port: 8080
    });

    return proxy.start()
        .then(() => {

            var driver = new webdriver.Builder()
                .forBrowser("chrome")
                .setChromeOptions(
                    new chrome.Options().setProxy({
                        proxyType: "manual",
                        httpProxy: "localhost:8080",
                        sslProxy: "localhost:8080"
                    })
                )
                .build();

            return load(driver, domain);
        })
        .then(() => {
            return proxy.shutdown();
        })
        .then((res) => {
            console.log(res.findings);
            return res;
        })
        .catch((err) => {
            console.error(err.message, err.stack);
        });
}

function load(driver, url) {
    return new Promise((resolve) => {
        driver.get(`https://${url}`);
        driver.sleep(20000);


        setTimeout(resolve, 20000);
        setTimeout(()=> {
            driver.quit();
        }, 30000)

    });
}


function run(urls, results = {}) {
    if(urls.length === 0) {
        return results;
    }

    const url = urls.shift();

    return runTest(url)
        .then((res) => {
            results[url] = res;
            return run(urls, results)
        });
}

run(websites)
    .then((results) => {
        fs.writeFileSync(path.join(__dirname, "../data/results_evaluation.json"), JSON.stringify(results, null, 2));
        console.log("DONE");
    })
    .catch((err) => { console.error(err.message, err.stack); });


