"use strict";

const jsdom = require("jsdom");
const fs = require("fs");

function scrapeAlexaTopSites(howMany) {
    let urls = [];
    const baseUrl = "http://www.alexa.com/topsites/global;";
    
    function scrapeSites(page) {
        return extractUrls(`${baseUrl}${page}`)
            .then((newUrls) => {
                urls = urls.concat(newUrls);
                
                if(urls.length >= howMany) {
                    return urls;
                }
                return scrapeSites(page + 1);
            })
    }

    return scrapeSites(0);
}

function extractUrls(url) {
    return new Promise((resolve, reject) => {
        jsdom.env({
            url: url,
            scripts: ["http://code.jquery.com/jquery.js"],
            done: function (err, window) {
                if(err){
                    reject(err);
                    return;
                }

                const $ = window.$;
                const urls = [];

                window.$("#alx-content > div > section.content-fixed.page-product-content > span > span > section > div.listings > ul > li > div.desc-container > p > a")
                    .each(function () {
                        urls.push($(this).text())
                    });

                resolve(urls);
            }
        });
    });
}

module.exports = scrapeAlexaTopSites;
