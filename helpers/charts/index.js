"use strict";

const fs = require("fs");
const template = require("./column.tpl.js");

module.exports = function chart(name, table, destination) {
    fs.writeFileSync(destination, template(name, table));    
};