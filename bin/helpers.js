"use strict";

const url = require("url");

exports.preProcessRequests = (req) => {
    req.duration = parseInt(req.duration);
    req.parsed = url.parse(req.name);

    const pathParts = req.parsed.path.split(".");

    if (pathParts.length === 1) {
        req.fileType = "api";
    }
    else {
        req.fileType = pathParts[pathParts.length - 1];
    }

    return req;
};

exports.formatRow = function formatRow(skip = [0]) {
    return function(rows) {
        return rows.map((elem, idx) => {
            if (skip.indexOf(idx) !== -1) {
                return elem;
            }
            /*
             if (idx === 0 || idx === 1) {
             return elem;
             }
             */
            if (elem === false || elem === 0) {
                return "";
            }

            if (Number.isInteger(elem)) {
                return "\\checkmark (" + elem + ")";
            }

            if (elem === true) {
                return "\\checkmark";
            }

            return "\\checkmark (" + elem + ")";
        });
    };
};

exports.filterByDomain = function filterByDomain(domain) {
    return function (req) {
        const hostname = req.parsed.hostname;

        if (!hostname) {
            return false;
        }

        //compare on hostname level
        const domainSplit = domain.split(".");
        domainSplit.splice(0, domainSplit.length - 2);

        const urlParts = hostname.split(".");
        req.baseUrl = urlParts[urlParts.length - 2] + "." + urlParts[urlParts.length - 1];

        return req.baseUrl === domainSplit.join(".");
    }
};

exports.filterByApi = (req) => req.fileType === "json" || req.fileType === "api" || !req.fileType;

exports.analyzeRequestDestinations = function analyzeRequestDestinations(requests) {
    const domains = {};

    requests.forEach((req) => {
        const hostname = req.parsed.hostname;

        if (!domains[hostname]) {
            domains[hostname] = 1;
        }
        else {
            domains[hostname]++;
        }
    });

    return domains;
};


exports.findByValue = function findByValue(arr, field, value) {
    return arr.filter((entry) => {
        if (entry[field] == value) {
            return entry;
        }
    })[0];
};

exports.texChars = {
    'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
    , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
    , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
    , 'right': '\\\\', 'right-mid': '', 'middle': '&'
};