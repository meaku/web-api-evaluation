"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const hoxy = require("hoxy");

const fs = require("fs");

const ca = {
    key: fs.readFileSync(__dirname + "/ca/root-ca.key.pem"),
    cert: fs.readFileSync(__dirname + "/ca/root-ca.crt.pem")
};

const proxy = hoxy.createServer({
    certAuthority: ca
}).listen(8080);

// Log every request through the proxy.
proxy.intercept("request", function(req, resp, cycle) {
    console.log(req.fullUrl());
});

proxy._tlsSpoofingServer.addListener("upgrade", function(req, socket, upgradeHead) {
    console.log("[spoofer] Upgrade");
});
