"use strict";

const { chart } = require("../../");

module.exports = function({ title = false, fileName, series, stacking = false, yMax}) {
    return chart({
        chart: {
            type: "column",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
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
            title: {
                text: "Latency (ms)",
                style: {
                    fontSize: "20px"
                }
            },
            categories: [20, 40, 80, 160, 320, 640],
            labels: {
                style: {
                    fontSize: "20px"
                }
            }
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: "Load Time (ms)"
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
