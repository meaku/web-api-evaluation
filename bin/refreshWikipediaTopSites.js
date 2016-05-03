"use strict";

const fs = require("fs");
const path = require("path");
const loadWikipidiaTop100 = require("../tools/loadWikipediaTop100");

loadWikipidiaTop100()
    .then((results) => results.filter((result) => result.type !== "Pornography"))
    .then((results) => {
        //remove the header line
        results.shift();

        const uniqueResults = [];

        results.forEach((result) => {
            result.baseUrl = result.domain.split(".")[0];

            if (!uniqueResults.find((entry) => entry.baseUrl === result.baseUrl)) {
                uniqueResults.push(result);
            }
        });

        console.log(`Loaded ${uniqueResults.length} domains, exluding ${100 - results.length} adult sites and ${results.length - uniqueResults.length} duplicates`);

        return uniqueResults;
    })
    .then((results) => {
        fs.writeFileSync(path.join(__dirname, "../data/top100Wikipedia.json"), JSON.stringify(results));
        process.exit(0);
    })
    .catch((err) => {
        throw err;
    });


