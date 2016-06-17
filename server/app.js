"use strict";

const fs = require("fs");
const path = require("path");
const resources = require("./lib/resources");

const express = require("express");
const app = express();

let lastEvent = null;

app.use((req, res, next) => {
    res.header("access-control-allow-origin", "*");
    next();
});

app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.use(express.static(__dirname + "/public"));

app.use("/start/:interval?", (req, res, next) => {
    function onData(d) {
        lastEvent = d;
    }

    app.es.start(req.params.interval);
    app.es.on("data", onData);
    app.es.once("end", () => {
        app.es.removeListener("data", onData);
        lastEvent = null;
        res.json({ status: "success" });
    });
});

app.get("/polling", (req, res, next) => {
    res.json(lastEvent || {});
    lastEvent = null;
});

app.get("/long-polling", (req, res) => {
    app.es.once("data", (data) => {
        res.json(data);
    });
});

app.get("/streamed-polling", (req, res) => {
    if (!app.http2) {
        res.set("Transfer-encoding", "chunked");
    }

    function onData(data) {
        res.write(JSON.stringify(data) + "\n");
    }
    
    app.es.once("end", () => {
        app.es.removeListener("data", onData);
        res.end();
    });

    app.es.on("data", onData);
});

app.get("/delay/:delay", (req, res) => {
    setTimeout(() => res.json({}), req.params.delay);
});

app.get("/:resourceType/:range", (req, res, next) => {
    const { resourceType, range } = req.params;

    if (!range || range.indexOf("-") === -1) {
        next();
        return;
    }

    let resource = resources[resourceType];
    let [startId, endId] = range.split("-");
    let ids = [];

    startId = parseInt(startId);
    endId = parseInt(endId);

    for (startId; startId <= endId; startId++) {
        ids.push(startId);
    }

    resource.readCollectionBatch(ids)
        .then(items => {

            //stream mode
            if (req.query.stream) {
                return res.send(items.map(d => JSON.stringify(d)).join("\n"));
            }

            res.json(items)
        })
        .catch(next);
});

app.get("/:resourceType/:id?", (req, res, next) => {
    const { id, resourceType } = req.params;
    const resource = resources[resourceType];

    if (!resource) {
        res.json({
            error: "invalid-resource"
        });

        return;
    }

    if (!id) {
        return resource.readCollection()
            .then((data) => res.json(data))
            .catch(next);
    }

    resource.read(id)
        .then((data) => {
            res.json(data)
        })
        .catch((err) => {
            console.error(err);

            res.json({
                error: "not-found",
                id
            });
        });
});

module.exports = app;