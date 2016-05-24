"use strict";

const webdriver = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

function browserUsageDetection() {
    const callback = arguments[arguments.length - 1];

    try {
        const results = {
            features: {
                applicationCache: window.applicationCache.status === 1,
                localStorage: window.localStorage.length,
                sessionStorage: window.sessionStorage.length,
                serviceWorker: navigator.serviceWorker.controller !== null
            },
            requests: {
                client: window.performance.getEntries()
            },
            timing: window.performance.timing
        };

        window.indexedDB.webkitGetDatabaseNames().onsuccess = function (sender) {
            results.features.indexedDBs = sender.target.result;
            callback(results);
        };
    }
    catch (err) {
        callback({
            error: err
        });
    }
}


const driver = new webdriver.Builder()
    .usingServer("http://192.168.99.100:4444/wd/hub")
    .forBrowser("chrome")
    .build();

driver.get(`https://peerigon.com`);

driver.manage().timeouts().setScriptTimeout(500);
driver.sleep(15000);

return driver.executeAsyncScript(browserUsageDetection)
    .then((res) => {
       // return driver.quit()
         //   .then(() => console.log(res.timing.loadEventEnd - res.timing.navigationStart));
    });