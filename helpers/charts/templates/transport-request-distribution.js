"use strict";

const { chart } = require("../../");
const { inspect } = require("util");

module.exports = function(title = "Item Distribution", fileName, categories = ["HTTP/1.1", "HTTP/2", "WebSocket"], series) {

    const chartConfig = {
        chart: {
            type: "bar",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
        },
        credits: {
            enabled: false
        },
        title: {
            text: title
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
            min: 0,
            title: {
                text: "Percent"
            }
        },
        legend:{
            reversed: true
        },
        plotOptions: {
            series: {
                stacking: "percent"
            },
            dataLabels: {
                shape: "callout",
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                style: {
                    color: "#FFFFFF",
                    textShadow: "none"
                }
            }
        },
        series
    };
    
    console.log(inspect(chartConfig, { depth: null }));
    return chart(chartConfig, fileName);
};



