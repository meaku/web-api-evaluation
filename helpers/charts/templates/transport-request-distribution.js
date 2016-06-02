"use strict";

const { chart, toChartSeries, networks } = require("../../");
const { inspect } = require("util");

module.exports = function(title, fileName, categories, durations) {

    /*
    [ { network: 'Fibre',
        name: ' < 122.70000000000022',
        count: 16,
        percent: 0.25806451612903225 },
        { network: 'Fibre',
            name: ' < 165.88500000000013',
            count: 14,
            percent: 0.22580645161290322 },
        { network: 'Fibre',
            name: ' < 209.07000000000005',
            count: 16,
            percent: 0.25806451612903225 },
        { network: 'Fibre',
            name: ' < 252.25499999999997',
            count: 13,
            percent: 0.20967741935483872 } ] ]
    */
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
    //return chart(chartConfig, fileName);
};



