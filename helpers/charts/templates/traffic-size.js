"use strict";

const { networks, toChartSeries, chart } = require("../../");
const { inspect } = require("util");

module.exports = function(title = false, fileName, categories, series, categoryTitle = "# Requests", yTitle = "Data Size (kB)") {
    return chart({
        chart: {
            type: "column",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
        },
        title: {
            text: false
        },
        credits: {
            enabled: false
        },
        xAxis: {
            categories,
            title: {
                text: categoryTitle,
                style: {
                    fontSize: "20px"
                }
            },
            labels: {
                style: {
                    fontSize: "20px"
                }
            }
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: yTitle,
                style: {
                    fontSize: "20px"
                }
            },
            labels: {
                style: {
                    fontSize: "20px"
                }
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




