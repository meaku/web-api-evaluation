"use strict";

const { chart } = require("../../");

module.exports = function (title, fileName, categories, series) {
    return chart({
        chart: {
            type: "column",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
        },
        data: {
            //switchRowsAndColumns: true
        },
        credits: {
            enabled: false
        },
        title: {
            text: title
        },
        xAxis: {
            categories,
            title: {
                text: "Latency (ms)"
            }
        },
        yAxis: {
            title: {
                text: "Load Time (ms)"
            }
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
        series
    }, fileName);
};
