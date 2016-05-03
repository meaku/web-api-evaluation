"use strict";

var webdriver = require("selenium-webdriver"),
    chrome = require("selenium-webdriver/chrome"),
    //firefox = require('selenium-webdriver/firefox'),
    By = webdriver.By,
    until = webdriver.until;

const initProxy = require("../proxy/proxy");

//const topWebsites = require("../tools/top100Wikipedia.json").map((website) => website.domain);

const websites = [
    "twitter.com",
    "github.com",
    "facebook.com"
    //"youtube.com",
    //"instagram.com",
    //"web.whatsapp.com",
    //"beta.peerigon.com/?tkn=nxD9vXEDdy49BZJ0CpJwXePFVL8Cq2"
];

const proxy = initProxy({
    domain: "nytimes.com",
    port: 8080
});

    proxy.start()
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

        return load(driver, "nytimes.com");
    })
    .then(() => {
       return proxy.shutdown();
    })
    .then((res) => {
        console.log("DONE!");
        console.log(res.findings);
        console.log(res.requests);
    })
    .catch((err) => {
      console.error(err.message, err.stack);
    });


function load(driver, url) {
    return new Promise((resolve) => {
        driver.get(`https://${url}`);
        driver.sleep(20000);
        driver.quit();

        setTimeout(resolve, 20000);
    })
}

/*
function run(urls) {
    if(urls.length === 0) {
        console.log("done");
        return;
    }

    const url = urls.pop();

    load(url)
        .then(() => { run(urls) });
}

run(websites);
*/

