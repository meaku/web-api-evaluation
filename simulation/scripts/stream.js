"use strict";

const performance = window.performance;
const start = performance.now();
let first;
let done;

function fetchJSONStream(url) {
    performance.mark("start");

    return fetch(url).then(response => {
        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let buffer = "";
        let item = "";
        const items = [];

        function log(str) {
            console.log(str);
        }

        function processJSON(result) {
            if (result.done) {
                // no more data, but there might be a JSON object left in the buffer
                if (buffer.trim()) {
                    items.push(JSON.parse(buffer));
                }
                done = performance.now();
                log(`Parsed first bit of JSON after ${first - start}ms`);
                log(`Parsed last bit of JSON after ${done - start}ms`);
                return items;
            }

            buffer += decoder.decode(result.value, { stream: true });

            while (true) {
                const indexOfNewline = buffer.indexOf('\n');
                if (indexOfNewline == -1) {
                    break;
                }

                item = JSON.parse(buffer.slice(0, indexOfNewline));

                items.push(item);
                
                performance.mark(`loaded-${item.id}`);
                performance.measure(`ttd-${item.id}`, "overall-start", `loaded-${item.id}`);

                if (!first) {
                    first = performance.now();
                }
                
                buffer = buffer.slice(indexOfNewline + 1);
            }

            return reader.read().then(processJSON);
        }

        return reader.read().then(processJSON);
    });
}


window.start = function (config) {
    performance.mark("overall-start");
    return fetchJSONStream(`https://${config.baseUrl}/items/1-${config.howMany}?stream=true`)
        .then((res) => {
            if(res.length !== config.howMany) {
                throw new Error("Unexpected Response: Expected " + config.howMany + ", got " + res.length)
            }
            
            performance.mark("overall-end");
            performance.measure("overall", "overall-start", "overall-end");
            
            const measures = performance.getEntriesByType("measure");

            return {
                duration: measures.find(r => r.name === "overall").duration
            };
        });
};

