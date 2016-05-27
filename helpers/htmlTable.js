"use strict";

/*
 <table id="datatable">
 <thead>
 <tr>
 <th></th>
 <th>HTTP/1.1</th>
 <th>HTTP/2</th>
 <th>WebSockets</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <th>2G</th>
 <td>900</td>
 <td>500</td>
 <td>200</td>
 </tr>
 <tr>
 <th>3G</th>
 <td>600</td>
 <td>300</td>
 <td>150</td>
 </tr>
 <tr>
 <th>2G</th>
 <td>400</td>
 <td>250</td>
 <td>100</td>
 </tr>
 </tbody>
 </table>
 */

/*
 ${addrs.map(addr => html`
 <tr>$${addr.first}</tr>
 <tr>$${addr.last}</tr>
 `)}

 */



function htmlTable(data, id) {
    return `
    <table id="${id || "datatable"}">
        <thead>
        <tr>
        <th></th>

    ${data.header.map(header => `
        <th>${header}</th>
    `).join("")}
    </tr>
    </thead>
    <tbody>
    ${data.rows.map(row => {
        return `
        <tr>
            <th>${row.shift()}</th>
            ${row.map(value => `<td>${value}</td>`)}
        </tr>`;
    }).join("")}
    
    </tbody>
    </table>
    `;
}

/*
const data = {
    header: ["HTTP/1.1", "HTTP/2", "WebSockets"],
    rows: [
        ["2G", 100, 200, 300],
        ["3G", 100, 200, 300],
        ["4G", 100, 200, 300]
    ]
};


htmlTable(data);

*/

module.exports = htmlTable;