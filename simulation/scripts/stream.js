"use strict";

const performance = window.performance;
const start = performance.now();
let first;
let done;

function fetchJSONStream(url) {
    performance.mark("start");

    return fetch(url + '?' + Math.random()).then(response => {
        const decoder = new TextDecoder();
        const reader = response.body.getReader();
        let buffer = '';
        const items = [];

        function log(str) {
            console.log(str);
        }

        function processJSON(result) {
            if (result.done) {
                // no more data, but there might be a JSON object left in the buffer
                if (buffer.trim()) items.push(JSON.parse(buffer));
                done = performance.now();
                log(`Parsed first bit of JSON after ${first-start}ms`);
                log(`Parsed last bit of JSON after ${done-start}ms`);
                return;
            }

            buffer += decoder.decode(result.value, {stream: true});

            while (true) {
                const indexOfNewline = buffer.indexOf('\n');
                if (indexOfNewline == -1) break;
                items.push(JSON.parse(buffer.slice(0, indexOfNewline)));
                performance.mark(`fetchEnd-${items.length}`);
                performance.measure(`fetch-${items.length}`, "start",`fetchEnd-${items.length}`);

                if (!first) first = performance.now();
                buffer = buffer.slice(indexOfNewline + 1);
            }

            return reader.read().then(processJSON);
        }

        return reader.read().then(processJSON);
    });
}


window.start = function (transport, type) {
    return fetchJSONStream("https://gist.githubusercontent.com/jakearchibald/aaa18014906f20a9e4c6448217b7438f/raw/fa8ef7719cf50388eeab275b36158df489ac8304/streaming-json.sjson");
};

