"use strict";

const exec = require("child_process").exec;
const inResults = require("../results/top100_techDistribution.json");
const fs = require("fs");
const path = require("path");

function checkHttp2(url) {
    return new Promise((resolve, reject) => {

        exec(`/usr/local/Cellar/nghttp2/1.9.2/bin/nghttp -n -v https://${url}`, (error, stdout, stderr) => {
            if (error) {
                return reject(error);
            }

            const res = stdout.substr(0, 200);

            if(stderr.indexOf("HTTP/2 protocol was not selected") !== -1) {
                if(stdout.indexOf("spdy") !== -1) {
                    return resolve("SPDY");
                }

                return resolve(false);
            }

            if (res.indexOf("h2") !== -1) {
                return resolve(true);
            }
        });
    });
}


Promise.all(Object.keys(inResults).map((url) => {

        return checkHttp2(url)
            .then((res) => {

                console.log(url, res);

                inResults[url].features.h2 =res;

                return {
                    url,
                    h2: res
                };
            });
    }))
    .then(res => console.log(res))
    .then(() => {
        fs.writeFileSync(path.resolve(__dirname, "../results/top100_techDistribution.json"), JSON.stringify(inResults))
    })
    .catch(err => console.error(err));

