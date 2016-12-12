"use strict";

const { networks, toChartSeries, chart } = require("../../");
const { inspect } = require("util");

module.exports = function({ title = false, fileName, categories, series, xLabel = "# Requests", yLabel = "Data Size (kB)", xMax, yMax}) {
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
            max: xMax,
            title: {
                text: xLabel,
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
                text: yLabel,
                style: {
                    fontSize: "20px"
                }
            },
            max: yMax,
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




