"use strict";

const { chart } = require("../../");
const { inspect } = require("util");

module.exports = function(title, fileName, categories, durations) {
    
    const chartConfig = {
        chart: {
            type: "bar"
        },
        title: {
            text: "Request Distribution"
        },
        xAxis: {
            categories: ["2G", "3G", "4G"]
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
            column: {
                //stacking: "normal"
            }
        },
        series: [
            {
                name: "41 - 100 %",
                data: [0.2, 0.3, 0.80]
            },
            {
                name: "21 - 40 %",
                data: [0.4, 0.3, 0.1]
            },
            {
                name: "0 - 20 %",
                data: [0.2, 0.3, 0.1]
            }]
    };
    
    //console.log(inspect(chartConfig, { depth: null }));
    return chart(chartConfig, fileName);
};



