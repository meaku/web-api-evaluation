"use strict";

const { chart } = require("../../");

/**
 * 
 * @param config
 */
module.exports = function(config) {
    const { title, categories, stacking, series, fileName, yLabel, xLabel, xMax, yMax } = config;

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
            text: title || false
        },
        xAxis: {
            title: {
                text: xLabel
            },
            categories,
            max: xMax
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: yLabel
            },
            max: yMax
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
