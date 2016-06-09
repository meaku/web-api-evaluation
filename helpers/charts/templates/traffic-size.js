"use strict";

const { networks, toChartSeries, chart } = require("../../");
const { inspect } = require("util");

module.exports = function(title, fileName, categories, series, categoryTitle = "# Requests", yTitle = "Data Size (kB)") {
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
        credits: {
            enabled: false
        },
        xAxis: {
            categories,
            title: {
                text: categoryTitle
            }
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: yTitle
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




