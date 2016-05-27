"use strict";

const Table = require("cli-table");

const texChars = {
    'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
    , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
    , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
    , 'right': '\\\\', 'right-mid': '', 'middle': '&'
};

function tabular(head, rows) {
    const cols = new Array(head.split("&").length - 1).fill("");
    
    return `
    \\begin{tabular}{l|${cols.map(() => "c").join("")}}
        \\hline
        \\rowcolor{tableheadcolor}
        ${head}
        \\hline
${rows}
        \\hline
    \\end{tabular}`;
}

function wrapper(caption, label, tabular) {
    return `
\\begin{table}[H]
    \\small\\sffamily\\centering\\renewcommand{\\arraystretch}{1.2}
    \\caption{${caption}}
    \\label{${label}}

    \\rowcolors{1}{tablebodycolor}{tablerowcolor}
    ${tabular}
\\end{table}`;
}


class LatexTable {
    constructor(options) {
        options.chars = texChars;

        //col width = header string length
        if(!options.colWidths) {
            options.colWidths = options.head.map(head => head.length * 10);
        }

        //make header bold
        options.head = options.head.map(head => `\\bfseries ${head}`);

        const tbl = new Table(options);

        tbl.toLatex = function() {
            //console.log(tbl);
            let rows = tbl.toString().split("\n");
            const head = rows.shift();

            rows = rows.join("\n");

            return wrapper(options.caption, options.label, tabular(head, rows));
        };
        
        return tbl;    
    }
}

module.exports = LatexTable;

/*
const tbl = new LatexTable({
    head: ["Domain", "SSE", "WS"]
});

tbl.push(["peerigon.com", "yes", "no"]);
tbl.push(["peerigon.de", "no", "yes"]);
tbl.push(["peerigon.org", "no", "yes"]);

console.log(tbl.toLatex());
//*/