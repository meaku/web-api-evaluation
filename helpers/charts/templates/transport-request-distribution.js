"use strict";

const { chart } = require("../../");
const { inspect } = require("util");

module.exports = function(title, fileName, categories, durations) {
    
    const chartConfig = {
        chart: {
            type: "column",
            renderTo: "container",
            width: 600,
            height: 400,
            forExport: true
        },

        title: {
            text: title
        },
        xAxis: {
            title: {
                text: "Request"
            },
            categories: categories
        },

        yAxis: {
            title: {
                text: "Requests"
            }
        },
        legend: {
            enabled: false
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

        series: durations
    };


    //console.log(inspect(chartConfig, { depth: null }));
    return chart(chartConfig, fileName);
};



