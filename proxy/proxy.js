"use strict";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const url = require("url");
const hoxy = require("hoxy");
const fs = require("fs");
const wsProxy = require("./wsProxy");

const ca = {
    key: fs.readFileSync(__dirname + "/ca/root-ca.key.pem"),
    cert: fs.readFileSync(__dirname + "/ca/root-ca.crt.pem")
};

module.exports = function init(options = {}) {
    const requests = [];

    const findings = {
        websockets: false,
        serviceWorker: false,
        sse: false,
        sameDomainRequests: 0,
        externalRequests: 0
    };

    function logRequest(req, res) {
        requests.push({
            url: req.fullUrl(),
            method: req.method,
            statusCode: res.statusCode,
            contentType: res.headers["content-type"],
            contentLength: res.headers["content-length"],
            duration: Date.now() - req.start,
            parsedUrl: url.parse(req.fullUrl())
        });

        console.log(`[${req.method}] ${req.fullUrl()}`);
    }

    const proxy = hoxy.createServer({
        certAuthority: ca
    });

    proxy.on("error", (err) => {
        console.error(err, err.stack);
    });


    proxy.intercept({
        phase: "request"
    }, function (req, res, cycle) {
        req.start = Date.now();
    });

    proxy.intercept({
        phase: "response"
    }, function (req, res, cycle) {
       try{

           logRequest(req, res);

           if(req.fullUrl().indexOf(options.domain) !== -1) {
               findings.sameDomainRequests++;
           }
           else {
               findings.externalRequests++;
           }
       }
        catch(err) {
            console.error(err.message, err.stack);
        }

    });

    proxy.intercept({
        phase: "request",
        fullUrl: "*/serviceworker.js"
    }, function (req) {
        console.log("service worker!", req.fullUrl());
        findings.serviceWorker = req.fullUrl;
    });

    proxy._tlsSpoofingServer.addListener("upgrade", function (req, socket, upgradeHead) {
        console.log("[spoofer] Upgrade", req.url, req.headers);
        findings.websockets = req.headers;
    });

    wsProxy(proxy._tlsSpoofingServer);

    setInterval(() => {
        console.log(findings);
    }, 5000);

    proxy.shutdown = function() {
        return new Promise((resolve, reject) => {
            proxy.close(function(err) { // optional callback
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    findings,
                    requests
                });
            });
        });
    };

    proxy.start = function() {
        return new Promise((resolve, reject) => {
           proxy.listen(options.port, function(err) {
               if(err) {
                   return reject(err);
               }
               resolve(proxy);
           });
        });
    };

    return proxy;
};


process.on("unhandledRejection", (err) => {
    throw err;
});

process.on("error", (err) => {
    console.error(err.message, err.stack);
    process.exit(1);
});



