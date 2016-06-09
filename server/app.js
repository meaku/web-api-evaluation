"use strict";

const fs = require("fs");
const path = require("path");
const resources = require("./lib/resources");
const EventStream = require("./lib/EventStream");
const compression = require("compression");

const express = require("express");
var app = express();

function shouldCompress(req, res) {
    if (process.env.compression) {
        // fallback to standard filter function
        return compression.filter(req, res)
    }
    
    return false;
}

app.use(compression({ filter: shouldCompress }));

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

app.get("/:resourceType/:range", (req, res, next) => {
    const { resourceType, range } = req.params;

    if(!range || range.indexOf("-") === -1) {
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
            if(req.query.stream) {
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