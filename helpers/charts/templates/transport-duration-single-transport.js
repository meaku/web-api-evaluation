"use strict";

const { chart } = require("../../");

module.exports = function ({ title = false, fileName, categories, series, yMax }) {
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
        legend: {
            itemStyle: {
                fontSize: '20px'
            }
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
                text: "Latency (ms)",
                style: {
                    fontSize: "20px"
                }
            },
            style: {
                fontSize: "20px"
            }
        },
        yAxis: {
            title: {
                text: "Load Time (ms)",
                style: {
                    fontSize: "20px"
                }
            },
            max: yMax,
            style: {
                fontSize: "20px"
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
