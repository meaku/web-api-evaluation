"use strict";

const { chart } = require("../../");

module.exports = function(title = false, fileName, categories, series, stacking = false) {
   
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
        legend: {
            itemStyle: {
                fontSize: '20px'
            }
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
            categories,
            labels: {
                style: {
                    fontSize: "20px"
                }
            }
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: "Load Time (ms)",
                style: {
                    fontSize: '20px'
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
