"use strict";

const fs = require("fs");
const resources = require("./resources");

const express = require("express");
var app = express();

app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.use(express.static(__dirname + "/public"));

app.get("/:resource/:id?", (req, res) => {
    if(!resources[req.params.resource]) {
        res.json({
            error: "invalid-resource"
        });

        return;
    }

    let resource = resources[req.params.resource];

    if(!req.params.id) {
        resource.readCollection().then((data) => res.json(data));
        return;
    }
    
    const id = req.params.id - 1;

    resource.read(resource[id])
        .then((data) => res.json(data))
        .catch((err) => {
            console.error(err);
            
            res.json({
                error: "not-found"
            });     
        });
});

module.exports = app;