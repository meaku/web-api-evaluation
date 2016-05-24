"use strict";

const sequest = require("sequest");

//sh -p 22222 -o StrictHostKeyChecking=no 
var seq = sequest("application@192.168.99.100:22222");
seq.on("error", (err) => console.error(err));

seq.pipe(process.stdout);
seq.write("sudo tc qdisc del dev eth0 root"); //clear all limits
//seq.write("sudo tc qdisc add dev eth0 root netem delay 1000ms"); //set latency
//seq.write("ls -la");
//seq.end();


