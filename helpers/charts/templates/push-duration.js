"use strict";

const { chart } = require("../../");

module.exports = function(title, fileName, categories, series, stacking = false) {
   
    return chart({
        chart: {
            type: "column",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
        },
        credits: {
            enabled: false
        },
        title: {
            text: title
        },
        xAxis: {
            title: {
                text: "Latency (ms)"
            },
            categories
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: "Load Time (ms)"
            }
        },
        plotOptions: {
            series: {
                stacking: stacking,
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
        series
    }, fileName);
};
