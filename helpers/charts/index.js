"use strict";

//highcharts-export-server -enableServer true

const jsdom = require("jsdom");
const fs = require("fs");
const request = require("request");
const highcharts = require("highcharts");

function chart(chartConfig, filePath) {
    
    return new Promise((resolve, reject) => {
        // Get the document and window
        const doc = jsdom.jsdom(`<!doctype html><html><body><div id="container"></div></body></html>`);
        const win = doc.defaultView;

        chartConfig.credits = {
            enabled: false
        };

        // Do some modifications to the jsdom document in order to get the SVG bounding boxes right.
        doc.createElementNS = require("./createElemNS")(doc);

        const Highcharts = highcharts(win);

        // Disable all animations
        Highcharts.setOptions({
            plotOptions: {
                series: {
                    animation: false,
                    dataLabels: {
                        defer: false
                    }
                }
            }
        });

        new Highcharts.Chart(chartConfig);

        const svg = win.document.getElementById("container").childNodes[0].innerHTML;

        //console.log(svg);
        console.log("Writing:" + filePath);
        //send the svg to the export service and save result as pdf
        const convertRequest = request.post({
            //url: "http://export.highcharts.com/",
            url: "http://localhost:7801",
            //url: "http://localhost:3030",
            form: {
                filename: "chart",
                width: 0,
                scale: 2,
                type: "application/pdf",
                svg: svg
            }
        }).pipe(fs.createWriteStream(filePath));
        
        convertRequest.on("error", (err) => reject(err));
        convertRequest.on("finish", () => resolve());
    });
}

module.exports = chart;