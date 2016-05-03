"use strict";

const fs = require("fs");
const path = require("path");
const scrapeAlexaTopSites = require("../tools/loadAlexaTopSites");

scrapeAlexaTopSites()
    .then((urls) => {
        console.log(`Got ${urls.length} domains from Alexa.`);
        fs.writeFileSync(path.resolve(__dirname, "../data/alexa.json"));
        process.exit(0);
    })
    .catch((err) => {
        throw err
    });
