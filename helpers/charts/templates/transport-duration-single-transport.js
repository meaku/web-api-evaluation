"use strict";

const { chart } = require("../../");

module.exports = function(title, fileName, categories, series) {
    return chart({
        chart: {
            type: "column",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
        },
        title: {
            text: title
        },
        xAxis: {
            categories,
            title: {
                text: "# Requests"
            }
        },
        yAxis: {
            title: {
                text: "Duration (ms)"
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
