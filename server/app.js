"use strict";

const fs = require("fs");
const path = require("path");
const resources = require("./lib/resources");
const EventStream = require("./lib/EventStream");

const express = require("express");
var app = express();

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