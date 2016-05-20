"use strict";

const EventEmitter = require("events").EventEmitter;

class EventStream extends EventEmitter {

    constructor(interval = 10000, random = false) {
        super();
        this.count = 0;

        setInterval(() => {
            this.emit("data", {
                count: this.count++,
                date: Date.now(),
                text: "Tofino Tofino Tofino"
            });
        }, interval);
    }
}

module.exports = EventStream;