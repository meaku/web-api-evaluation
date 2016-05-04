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

    proxy.intercept({
        phase: "response",
        contentType: "text/event-stream"
    }, function (req) {
        console.log("event stream!", req.fullUrl());
        findings.sse = req.fullUrl;
    });

    proxy.intercept({
        phase: "request",
        fullUrl: "*/sw.js"
    }, function (req) {
        console.log("service worker!", req.fullUrl());
        findings.serviceWorker = req.fullUrl;
    });

    proxy._tlsSpoofingServer.once("upgrade", function (req, socket, upgradeHead) {
        console.log("[spoofer] Upgrade", req.url);
        findings.websockets = req.headers;
    });

    wsProxy(proxy._tlsSpoofingServer);

    proxy._sockets = [];

    proxy._server.on("connection", (socket) => {
        proxy._sockets.push(socket);
    });

    proxy._tlsSpoofingServer.on("connection", (socket) => {
        proxy._sockets.push(socket);
    });

    proxy.shutdown = function() {
        function closeConnection(server, serverName) {
            return new Promise((resolve, reject) => {
                server.close((err) => {
                    if(err) {
                        return reject(err);
                    }

                    console.log(serverName + " closed ");
                    resolve();
                })

            });
        }

        proxy._sockets.forEach((socket) => {
            socket.destroy();
        });
        
        return Promise.all([
            closeConnection(proxy._server, "_server"),
            closeConnection(proxy._tlsSpoofingServer, "_tlsSpoofingServer")
        ])
            .then(() => {
                proxy._sockets = [];

                return {
                    findings,
                    requests
                };
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

process.on("uncaughtException", (err) => {
    console.error(err.message, err.stack);
    process.exit(1);
});



