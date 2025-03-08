const { Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Path to the connection profile
const directory = '/etc/hyperledger/fabric';
const files = fs.readdirSync(directory);
const connectionFile = files.find(file => file.startsWith('connection-') && file.endsWith('.json'));

if (!connectionFile) {
    throw new Error('No connection profile found in the directory');
}

const profilePath = path.join(directory, connectionFile);
const ccp = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

// Path to Admin identity credentials
const certPath = `/etc/hyperledger/fabric/users/Admin@${process.env.ORG_ID_FOR_FOLDERS}.example.com/msp/signcerts/Admin@${process.env.ORG_ID_FOR_FOLDERS}.example.com-cert.pem`;
const keyPath = `/etc/hyperledger/fabric/users/Admin@${process.env.ORG_ID_FOR_FOLDERS}.example.com/msp/keystore/priv_sk`;

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error('Admin credentials not found');
}

const identity = {
    credentials: {
        certificate: fs.readFileSync(certPath, 'utf8'),
        privateKey: fs.readFileSync(keyPath, 'utf8')
    },
    mspId: `${process.env.ORG_NAME}MSP`,
    type: 'X.509'
};

// Connect to the Hyperledger Fabric network using Admin identity
async function connectToNetwork(contractName) {
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        identity,
        discovery: { enabled: true, asLocalhost: true }
    });

    // Get the network and contract
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract(contractName);

    return { gateway, contract };
}

module.exports = connectToNetwork;
