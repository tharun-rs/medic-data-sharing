import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr } from '@multiformats/multiaddr';
import { bootstrap } from '@libp2p/bootstrap';
import { kadDHT } from '@libp2p/kad-dht';
import { jsonToStream, streamToJSON } from './streams.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const protocol = '/json-exchange/1.0.0';
// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bootstrapUrlPath = path.join(__dirname,'/BOOTSTRAP_URL.txt');

// Create a node
export const createNode = async () => {
    let bootstrapList = [];

    // Read bootstrap URLs from the file, if it exists
    if (fs.existsSync(bootstrapUrlPath)) {
        const fileContent = fs.readFileSync(bootstrapUrlPath, 'utf8');
        bootstrapList = fileContent.split('\n').filter((line) => line.trim() !== '');
    } else {
        console.warn('Bootstrap file not found. Using default configuration.');
    }

    const node = await createLibp2p({
        addresses: { listen: ['/ip4/0.0.0.0/tcp/0'] },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
            bootstrap({
                list: bootstrapList,
                interval: 20000,
            }),
        ],
        dht: kadDHT({
            enabled: true, // Enable the DHT
            randomWalk: {
                enabled: true, // Allow random-walk to find more peers
            },
        }),
    });

    await node.start(); // Start the node
    console.log('Node is running at:', node.getMultiaddrs().map((addr) => addr.toString()));
    return node;
};

// Send data to a peer using the protocol
export const sendToNode = async (senderNode, receiverAddr, jsonData) => {
    const receiverMultiaddr = multiaddr(receiverAddr);
    try {
        await senderNode.dialProtocol(receiverMultiaddr, protocol)
            .then(stream => {
                jsonToStream(jsonData, stream);
            });
        console.log('JSON data sent');
    } catch (error) {
        console.error('Error sending JSON data:', error);
    }
};

export const setNodeListener = async (node, processFunction) => {
    // Handle incoming messages on the protocol
    node.handle(protocol, async ({ stream }) => {
        const jsonData = await streamToJSON(stream);
        processFunction(jsonData);
    });

};