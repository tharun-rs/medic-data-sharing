/* eslint-disable no-console */

import * as lp from 'it-length-prefixed'
import map from 'it-map'
import { pipe } from 'it-pipe'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

export async function jsonToStream(jsonData, stream) {
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

export async function streamToJSON(stream) {
    let jsonData;
    await pipe(
        // Read from the stream source
        stream.source,
        // Decode length-prefixed data
        (source) => lp.decode(source),
        // Turn buffers into strings
        (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
        async function (source){
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

