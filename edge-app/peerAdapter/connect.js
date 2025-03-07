const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Path to the connection profile and wallet
const directory = '/etc/hyperledger/fabric/';
// Get all files in the directory
const files = fs.readdirSync(directory);
// Find the first file that matches `connection-*.json`
const connectionFile = files.find(file => file.startsWith('connection-') && file.endsWith('.json'));
if (!connectionFile) {
    throw new Error('No connection profile found in the directory');
}
// Construct the full path
const profilePath = path.join(directory, connectionFile);
// Read and parse the connection profile
const ccp = JSON.parse(fs.readFileSync(profilePath, 'utf8'));


// Connect to the Hyperledger Fabric network
async function connectToNetwork(contractName) {
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if the user exists in the wallet
    const identity = await wallet.get('appUser');
    if (!identity) {
        console.log('An identity for the user "appUser" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }

    // Connect to the gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true }
    });

    // Get the network and contract
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract(contractName);
    return { gateway, contract };
}