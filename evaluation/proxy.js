"use strict";

require("longjohn");

const initProxy = require("../proxy/proxy");

const proxy = initProxy({
    domain: process.env.PROXY_DOMAIN,
    port: process.env.PROXY_PORT || 8080
});

function send(msg) {
    if(process.send) {
        process.send(msg);
    }
}

proxy.start()
    .then(() => {
        console.log(`Proxy started for ${process.env.PROXY_DOMAIN} on localhost:${ process.env.PROXY_PORT}`);
        
        send({
            cmd: "ready"
        });
    });

process.on("message", (msg) => {
    if(msg.cmd === "shutdown") {
        send({
            cmd: "results",
            results: proxy.getResults()
        });
        proxy.shutdown();

        console.log("Shutdown proxy server");
        setTimeout(() => {
            process.exit(0);
        }, 500);
    }
});

process.on("disconnect", () => {
    process.exit(0);
});

process.on("unhandledRejection", (err) => {
    throw err;
});

process.on("uncaughtException", (err) => {
    console.error(err.message, err.stack);
    process.exit(1);
});

setTimeout(() => {
    process.exit(0);
}, 30000);