"use strict";

const fs = require("fs");
const jsdom = require("jsdom");

/**
 * 
 * @returns {Promise}
 */
function loadWikipidiaTop100() {
    return new Promise((resolve, reject) => {
        jsdom.env({
            url: "https://en.wikipedia.org/wiki/List_of_most_popular_websites",
            scripts: ["http://code.jquery.com/jquery.js"],
            done: function (err, window) {
                if (err) {
                    reject(err);
                    return;
                }

                const $ = window.$;
                
                const results = $('#mw-content-text > transportsTable > tbody > tr').map(function () {
                    const $row = $(this);

                    return {
                        site: $row.find('td:nth-child(1)').text(),
                        domain: $row.find('td:nth-child(2)').text(),
                        alexa: $row.find('td:nth-child(3)').text(),
                        similarweb: $row.find('td:nth-child(4)').text(),
                        type: $row.find('td:nth-child(5)').text(),
                        principalCountry: $row.find('td:nth-child(6)').text()
                    };
                }).get();
                resolve(results);
            }
        });
    });
}

module.exports = loadWikipidiaTop100;