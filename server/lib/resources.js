"use strict";

const data = require("../data");
const resourceTypes = Object.keys(data);

class Resource {
    constructor(name, dataSource) {
        this.name = name;
        this.data = dataSource;
    }

    readCollection() {
        return Promise.resolve(this.data);
    }

    readCollectionBatch(ids) {
        return Promise.all(ids.map(id => this.read(id)))
    }
    
    read(id) {
        //array starts with 0, we want regular numeric ids
        id = id - 1;
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