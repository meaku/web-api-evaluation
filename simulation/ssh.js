"use strict";

const sequest = require("sequest");


const connection = sequest.connect("application@localhost:22222", {});


connection("ls", (e, stdout) => {
   console.log(e, stdout);
});
