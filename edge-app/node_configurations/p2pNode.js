import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { multiaddr } from '@multiformats/multiaddr';
import { bootstrap } from '@libp2p/bootstrap';
import { jsonToStream, streamToJSON } from './streams.js';

const protocol = '/json-exchange/1.0.0';

// Create a node
export const createNode = async () => {
    const node = await createLibp2p({
        addresses: { listen: ['/ip4/0.0.0.0/tcp/0'] },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
            bootstrap({
                list: [
                    '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWASdC5RaPsiHSndq6KtrhYZ4wx4n48nVC3q4pRFwrNyc4'
                ],
                interval: 20000,
            }),
        ]
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