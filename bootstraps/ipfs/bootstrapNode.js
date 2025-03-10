import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { generateKeyPair } from '@libp2p/crypto/keys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';



const bootstrapUrlPath = './ipfs/BOOTSTRAP_URL.txt';
const keyPath = './ipfsBOOTSTRAP_KEYS.json';


const loadOrGenerateKey = async () => {
    let privateKeyData;

    if (fs.existsSync(keyPath)) {
        // Load PeerId from file
        privateKeyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else {
        // Generate a new PeerId
        privateKeyData = await generateKeyPair('Ed25519');
        fs.writeFileSync(keyPath, JSON.stringify(privateKeyData));
    }

    let privateKey = await generateKeyPair('Ed25519');
    privateKey.raw = new Uint8Array(Object.values(privateKeyData.raw));
    privateKey.publicKey.raw = new Uint8Array(Object.values(privateKeyData.publicKey.raw));;


    return privateKey;
};


export const createBootstrapNode = async () => {
    const privateKey = await loadOrGenerateKey();
    const node = await createLibp2p({
        addresses: {
            listen: [`/ip4/0.0.0.0/tcp/4003`],
        },
        privateKey,
        transports: [tcp()],
        connectionEncryption: [noise()],
        streamMuxers: [yamux()],
    });

    await node.start();

    console.log(`Bootstrap node is running`);
    console.log('Listening on addresses:');
    node.getMultiaddrs().forEach((addr) => {
        console.log(addr.toString());
    });

    node.addEventListener('peer:discovery', (evt) => {
        console.log('Found peer:', evt.detail.toString());
      });
    
      node.addEventListener('peer:connect', (evt) => {
        console.log('Connected to peer:', evt.detail.toString());
      });
    
      node.addEventListener('peer:disconnect', (evt) => {
        console.log('Disconnected from peer:', evt.detail.toString());
      });

    
    //write bootstrap url to file
    if (!fs.existsSync(bootstrapUrlPath)) {
        const multiaddrs = node.getMultiaddrs().map(addr => addr.toString()).join('\n');
        fs.writeFileSync(bootstrapUrlPath, multiaddrs);
    }
    return node;
};


