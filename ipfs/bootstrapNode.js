import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { generateKeyPair } from '@libp2p/crypto/keys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bootstrapUrlPath = path.join(__dirname,'/BOOTSTRAP_URL.txt');
const keyPath = path.join(__dirname,'BOOTSTRAP_KEYS.json');


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


const createBootstrapNode = async () => {
    const privateKey = await loadOrGenerateKey();
    const node = await createLibp2p({
        addresses: {
            listen: [`/ip4/0.0.0.0/tcp/4001`],
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
    
    //write bootstrap url to file
    if (!fs.existsSync(bootstrapUrlPath)) {
        const multiaddrs = node.getMultiaddrs().map(addr => addr.toString()).join('\n');
        fs.writeFileSync(bootstrapUrlPath, multiaddrs);
    }
    return node;
};

createBootstrapNode().catch((err) => {
    console.error("Error starting node: ", err);
})

