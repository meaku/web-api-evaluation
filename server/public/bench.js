"use strict";

const transports = {
    fetch: function(config) {
        const { url, method } = config;
        return fetch(url, { method })
            .then((res) => res.json());
    },
    xhr: function(config) {
        const { url, method } = config;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open(method.toUpperCase(), url);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.onload = function() {
                resolve(this.response);
            };

            xhr.onerror = function(err) {
                reject(err);
            };

            xhr.send();
        });
    }
};

class Client {
    constructor(transport) {
        this.transport = transports[transport];
    }
    request(method, url) {
        return this.transport({
            method,
            url
        });
    }
}