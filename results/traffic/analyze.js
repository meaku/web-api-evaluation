"use strict";

const fs = require("fs");
const ss = require("simple-statistics");

function readContent(name) {
    console.log(__dirname + "/" + name + ".txt");
    return fs.readFileSync(__dirname + "/" + name + ".txt", { encoding: "utf-8"});
}

function analyze(file) {
    let lines = file.split("\n");
    let total = 0;

    const sizes = lines.map((line) => {
        const s = line.split(" ");
        return parseInt(s[s.length - 1])
    });
    
    sizes.forEach(s => total += parseInt(s));

    return {
        total,
        length: lines.length,
        mean: ss.mean(sizes),
        median: ss.median(sizes),
        min: ss.min(sizes),
        max: ss.max(sizes)
    }
}

const names = ["h1", "h2", "ws"];

const data = names
    .map((n) => readContent(n))
    .map((result) => analyze(result));

names.forEach((name, i) => console.log(name, data[i]));



