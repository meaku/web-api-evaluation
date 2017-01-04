"use strict";

const argv = require("yargs").argv;
const runSimulation = require("./simulation");

const task = argv.analyze ? "analyze" : "run";
const name = argv.name;

function saveRequire(path, errorMsg) {
    try {
        return require(path);
    }
    catch (err) {
        console.log(err.message);
        if (err.message.indexOf("Cannot find module ") === -1) {
            throw err;
        }
        throw new Error(errorMsg);
    }
}

const simulation = saveRequire(`${__dirname}/simulations/${name}`, "Could not find simulation: " + name);

if (task === "run") {

    if (simulation.run) {
        simulation.run()
            .then(() => process.exit(0));
        return;
    }

    runSimulation(simulation.conditions, simulation.script, simulation.runner, simulation.resultDir)
        .then(res => simulation.analyze(res))
        .then(() => process.exit(0))
        .catch(err => console.error(err.message, err.stack));

    return;
}

const results = saveRequire(simulation.resultDir + "/results.json", "No results found...");

simulation.analyze(results).then(() => process.exit(0));

