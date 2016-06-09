"use strict";

const randomstring = require("randomstring");

function rString(length) {
    return randomstring.generate(length);
}

function rNumber(length) {
    return randomstring.generate({
        length,
        charset: "numeric"
    });
}

function rDate() {
    const start = new Date(2012, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function rArray(howMany) {
    return new Array(howMany).fill("").map(() => rString(10));
}

function generateItem() {
    return {
        name: rString(20),
        "rotation_period": rNumber(5),
        "orbital_period": rNumber(4),
        "diameter": rNumber(6),
        "climate": rString(30),
        "gravity": rString(28),
        "terrain": rString(8),
        "surface_water": rNumber(5),
        "population": rNumber(12),
        "created": rDate(),
        "edited": rDate(),
        "url": rString(20),
        "description": rString(100),
        "films": rArray(4),
        "residents": rArray(10)
    }
}

function generateItemSet(howMany) {
    return new Array(howMany).fill("").map(() => generateItem());
}

console.log(JSON.stringify(generateItemSet(100)));


