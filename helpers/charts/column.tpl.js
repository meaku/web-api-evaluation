"use strict";

module.exports = function render(title, table) {
    return `
<html>
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/data.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.jquery.com/jquery-2.2.4.min.js"
        integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>

<div id="container" style="min-width: 310px; height: 400px; margin: 0 auto"></div>

${table}

<script>
    $(function () {

        new Highcharts.Chart({
            data: {
                table: 'datatable'
            },
            chart: {
                type: 'column',
                renderTo: "container"
            },
            title: {
                text: '${title}'
            },
            yAxis: {
                allowDecimals: false,
                title: {
                    text: 'Load Time'
                }
            }
        });
    });
</script>
</html>
`;
};