/* eslint-disable no-console */

const lp = require('it-length-prefixed');
const map = require('it-map');
const { pipe } = require('it-pipe');
const { fromString: uint8ArrayFromString } = require('uint8arrays/from-string');
const { toString: uint8ArrayToString } = require('uint8arrays/to-string');

async function jsonToStream(jsonData, stream) {
    const jsonString = JSON.stringify(jsonData);
    const jsonBuffer = uint8ArrayFromString(jsonString);

    await pipe(
        // Create a source that emits the JSON buffer
        [jsonBuffer],
        // Encode the data as length-prefixed
        lp.encode,
        // Send to the stream sink
        stream.sink
    );
}

async function streamToJSON(stream) {
    let jsonData;
    await pipe(
        // Read from the stream source
        stream.source,
        // Decode length-prefixed data
        (source) => lp.decode(source),
        // Turn buffers into strings
        (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
        async function (source) {
            for await (const msg of source) {
                try {
                    jsonData = JSON.parse(msg);
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                }
            }
        }
    );
    return jsonData;
}

module.exports = { jsonToStream, streamToJSON };
