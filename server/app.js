"use strict";

const fs = require("fs");
const path = require("path");
const resources = require("./lib/resources");
const EventStream = require("./lib/EventStream");
const compression = require("compression");

const express = require("express");
var app = express();

function shouldCompress(req, res) {
    console.log("compress?", process.env.compression);

    if (process.env.compression) {
        // fallback to standard filter function
        return compression.filter(req, res)
    }

    // don't compress responses with this request header
    return false;
}

app.use(compression({filter: shouldCompress}));

//app.use(compression());

app.use("/configure", (req, res, next) => {
    process.env.compression = Boolean(req.query.compression || false) || false;
    console.log(process.env.compression);
});

app.use((req, res, next) => {
    res.header("access-control-allow-origin", "*");
    next();
});

app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.use(express.static(__dirname + "/public"));

/*
 app.get("/polling", (req, res, next) => {
 const eventStream = new EventStream();

 const timeout =  setTimeout(() => {
 res.json({});
 }, 10000);

 eventStream.once("data", (data) => {
 res.json(data);
 clearTimeout(timeout);
 });
 });
 */

app.get("/file/:name", function (req, res, next) {
    var options = {
        root: path.join(__dirname, "/data/files/"),
        dotfiles: "deny"
    };

    res.sendFile(req.params.name, options, (err) => {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        }
    });
});

app.get("/delay/:delay", (req, res) => {
    setTimeout(() => res.json({}), req.params.delay);
});

app.get("/long-polling", (req, res) => {
    const eventStream = new EventStream();
    const timeout = setTimeout(() => {
        res.json({});
    }, 10000);

    eventStream.once("data", (data) => {
        res.json(data);
        clearTimeout(timeout);
    });
});

app.get("/streamed-polling", (req, res) => {
    if (!app.http2) {
        res.set("Transfer-encoding", "chunked");
    }

    res.write("{ ok: true }");

    const eventStream = new EventStream(1000);

    setTimeout(() => {
        eventStream.removeAllListeners();
        res.end();
    }, 30000);

    eventStream.on("data", (data) => {
        res.write(JSON.stringify(data));
    });
});

app.get("/stream/:resource", (req, res) => {
    let resource = resources[req.params.resource];
    res.send(resource.readCollectionStream());
});

app.get("/:resource/:id?", (req, res) => {
    if (!resources[req.params.resource]) {
        res.json({
            error: "invalid-resource"
        });

        return;
    }

    let resource = resources[req.params.resource];

    if (!req.params.id) {
        resource.readCollection().then((data) => res.json(data));
        return;
    }

    const id = req.params.id;

    resource.read(id)
        .then((data) => res.json(data))
        .catch((err) => {
            console.error(err);

            res.json({
                error: "not-found",
                id
            });
        });
});

module.exports = app;