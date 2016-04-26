"use strict";

const data = require("./data");
const resourceTypes = Object.keys(data);

class Resource {
    constructor(name, dataSource) {
        this.name = name;
        this.data = dataSource;
    }

    readCollection() {
        return Promise.resolve(this.data);
    }

    read(id) {
        if(!this.data[id]) {
            return Promise.reject(new Error(`Resource ${this.name}[${id}] not found`));
        }

        return Promise.resolve(this.data[id]);
    }
}

const resources = {};

resourceTypes.forEach((resourceId) => {
     resources[resourceId] = new Resource(resourceId, data[resourceId]);
});

module.exports = resources;