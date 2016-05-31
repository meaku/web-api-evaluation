"use strict";

const { networks, toChartSeries, chart } = require("../../");

module.exports = function(title, fileName, data) {
    const series = toChartSeries(
        data,
        "transport",
        "duration",
        {
            "HTTP/1.1": "HTTP/1.1",
            "HTTP/2": "HTTP/2",
            "WebSocket": "Websocket"
        }
    );

    console.log(series);

    return chart({
        chart: {
            type: "column",
            renderTo: "container",
            forExport: true,
            width: 600,
            height: 400
        },
        title: {
            text: title
        },
        xAxis: {
            categories: networks
        },
        yAxis: {
            //allowDecimals: false,
            title: {
                text: "Load Time"
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
