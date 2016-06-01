"use strict";

const jsdom = require("jsdom");
const fs = require("fs");
const request = require("request");
const highcharts = require("highcharts");

function chart(chartConfig, filePath) {
    // Get the document and window
    const doc = jsdom.jsdom(`<!doctype html><html><body><div id="container"></div></body></html>`);
    const win = doc.defaultView;

    chartConfig.chart.credits = {
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

    console.log("Writing:" + filePath);
    //send the svg to the export service and save result as pdf
    request.post({
        url: "http://export.highcharts.com/",
        form: {
            filename: "chart",
            width: 0,
            scale: 2,
            type: "application/pdf",
            svg: svg
        }
    }).pipe(fs.createWriteStream(filePath));
}

module.exports = chart;