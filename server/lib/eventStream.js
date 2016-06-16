"use strict";

const EventEmitter = require("events").EventEmitter;
const present = require("present");

const item = {
    "name": "6mWejg2XbEjxI203R4LB",
    "id": 1,
    "rotation_period": "59503",
    "orbital_period": "2874",
    "diameter": "542094",
    "climate": "wXSAuh44FzLdqfeqtYbXxlnObD7GVl",
    "gravity": "r6YJl60gM6VYn8RpDOIbKqNU3AuR",
    "terrain": "zgxkAKV4",
    "surface_water": "59127",
    "population": "534732496349",
    "created": "2014-10-15T02:55:48.040Z",
    "edited": "2016-03-29T13:00:25.185Z",
    "url": "cIzgUsoTHqPvBO76vYC1",
    "description": "opDSkVlWcUkjD1gGIRVGcoUiHauZfwsTvIGJ6pCiOVids0wPjv7iq2SZxchYIYQ4hIVxkyEm1uX5Ht83z1wDT6FohHWI6WmyT81J",
    "longText": "5N61F32SjhceGwD2uT3bsDaVapXhtDOt8oJncBuglhAbUQsYzW2NX5dDwBuOQJr0oY1oRoe8GqtAIBdQuWPgKif7l4HfgH9Y2Wb58Pwe0o2tcvgNQlIEyOBBiXdcU1zYVLt1nsRW9FuVvDQoLnrS3KO0mRMjhhla1Bygn59nUIHs0Y47QM5tScQEQf7xuLuo8C4vYFZX",
    "films": [
        "dGVw10mUJf",
        "QO37yh514N",
        "qQKXP0a3qv",
        "eFhvD808ji",
        "rNbqH1uaxY",
        "h5J6m9cds3",
        "PQRUF1E2TY",
        "lYBnaOhBHC",
        "eVxiemUEFO",
        "G0G1eNbGnG",
        "96uvDj5a87",
        "2APpiF16Eh",
        "tfRkR2yWKO",
        "6lhTVZQdid",
        "ZDB1udexRj",
        "6Czfcfug4W",
        "GvuGpZqJZR",
        "0xzbhqvEhG",
        "G7LxYMVsSf",
        "S4X4RSRAau"
    ],
    "residents": [
        "5cMyLK2w3m",
        "gOFmyrDJsR",
        "NnDvCGTISG",
        "I5OZjB4oQQ",
        "E03qTMxJXl",
        "EWX0ZMH9dE",
        "SogPEZ2GOH",
        "fVyHdblmDg",
        "jHt3F6ssCD",
        "FSDVIVznoI"
    ]
};

class EventStream extends EventEmitter {
    constructor() {
        super();
    }

    reset() {
        console.log("EventStream: end");
        this.emit("end");
        clearInterval(this.emitter);
        //this.removeAllListeners();
        this.count = 1;
    }

    start(interval = 5000, howMany = 10) {
        console.log("start");
        this.count = 1;

        if (this.emitter) {
            this.reset();
        }

        this.emitter = setInterval(() => {
            item.id = this.count++;
            item.createdAt = Date.now();
            console.log("EventStream: " + item.id);
            this.emit("data", item);

            if (this.count > howMany) {
                this.reset();
            }
        }, interval);
    }
}

module.exports = EventStream;