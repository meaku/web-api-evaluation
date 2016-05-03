"use strict";

const proxy = require("../proxy/proxy");

proxy({
    domain: "heise.de"
}).listen(8080);