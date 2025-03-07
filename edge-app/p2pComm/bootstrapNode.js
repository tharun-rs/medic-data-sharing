const { createLibp2p } = require('libp2p');
const { tcp } = require('@libp2p/tcp');
const { noise } = require('@chainsafe/libp2p-noise');
const { yamux } = require('@chainsafe/libp2p-yamux');
const { generateKeyPair } = require('@libp2p/crypto/keys');
const fs = require('fs');
const path = require('path');

const __dirname = __filename ? path.dirname(__filename) : process.cwd();
const bootstrapUrlPath = path.join(__dirname, 'BOOTSTRAP_URL.txt');
const keyPath = path.join(__dirname, 'BOOTSTRAP_KEYS.json');

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
    privateKey.publicKey.raw = new Uint8Array(Object.values(privateKeyData.publicKey.raw));

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

    // Write bootstrap URL to file
    if (!fs.existsSync(bootstrapUrlPath)) {
        const multiaddrs = node.getMultiaddrs().map(addr => addr.toString()).join('\n');
        fs.writeFileSync(bootstrapUrlPath, multiaddrs);
    }
    return node;
};

createBootstrapNode().catch((err) => {
    console.error("Error starting node: ", err);
});
