"use strict";

const { chart } = require("../../");
const { inspect } = require("util");

/**
 * 
 * @param title
 * @param fileName
 * @param requests
 * @param timings
 */
module.exports = function(title, fileName, requests, timings) {

    const chartConfig = {
        chart: {
            type: "columnrange",
            renderTo: "container",
            inverted: true,
            width: 600,
            height: 400,
            forExport: true
        },

        title: {
            text: title
        },
        xAxis: {
            title: {
                text: "Request"
            },
            categories: requests
        },

        yAxis: {
            title: {
                text: "Time (ms)"
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            series: {
                dataLabels: {
                    shape: "callout",
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                    style: {
                        color: "#FFFFFF",
                        textShadow: "none"
                    }
                }
            }
        },

        series: [{
            name: "Requests",
            data: timings
        }]

    };


    console.log(inspect(chartConfig, { depth: null }));


    //return chart(chartConfig, fileName);
};



