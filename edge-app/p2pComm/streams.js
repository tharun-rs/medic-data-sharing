/* eslint-disable no-console */

let lp, map, pipe, uint8ArrayFromString, uint8ArrayToString;

async function loadDependencies() {
  ({ default: lp } = await import('it-length-prefixed'));
  ({ default: map } = await import('it-map'));
  ({ pipe } = await import('it-pipe'));
  ({ fromString: uint8ArrayFromString } = await import('uint8arrays/from-string'));
  ({ toString: uint8ArrayToString } = await import('uint8arrays/to-string'));
}

// Call the function to load dependencies
loadDependencies().catch((err) => {
  console.error('Failed to load dependencies:', err);
  process.exit(1);
});


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
