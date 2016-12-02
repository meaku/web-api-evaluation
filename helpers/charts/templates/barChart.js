"use strict";

const { chart } = require("../../");

/**
 *
 * @param title
 * @param categories
 * @param stacking
 * @param series
 * @param fileName
 * @param yLabel
 * @param xLabel
 * @param xMax
 * @param yMax
 */
module.exports = function({ title, categories, stacking, series, fileName, yLabel, xLabel, xMax, yMax }) {

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
                fontSize: "20px"
            }
        },
        title: {
            text: title || false
        },
        xAxis: {
            title: {
                text: xLabel,
                style: {
                    fontSize: "20px"
                }
            },
            categories,
            max: xMax,
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
                stacking: stacking || false,
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
