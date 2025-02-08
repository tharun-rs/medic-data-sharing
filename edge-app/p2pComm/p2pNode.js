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
const bootstrapUrlPath = path.join(__dirname, '/BOOTSTRAP_URL.txt');

class P2PNode {
  constructor() {
    this.node = null;
  }

  /**
   * Initializes the Libp2p node with bootstrap addresses and configuration
   */
  async initialize() {
    let bootstrapList = [];
  
    // Read bootstrap URLs from the file, if it exists
    if (fs.existsSync(bootstrapUrlPath)) {
      const fileContent = fs.readFileSync(bootstrapUrlPath, 'utf8');
      bootstrapList = fileContent.split('\n').filter((line) => line.trim() !== '');
    } else {
      console.warn('Bootstrap file not found. Using default configuration.');
    }
  
    this.node = await createLibp2p({
      addresses: { listen: ['/ip4/0.0.0.0/tcp/4002'] },
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
  
    await this.node.start(); // Start the node
    console.log('Node is running at:', this.node.getMultiaddrs().map((addr) => addr.toString()));
  }

  /**
   * Sends JSON data to a specified peer address
   * @param {String} receiverAddr Address of the receiver peer
   * @param {JSON} jsonData Data to be sent
   */
  async sendToNode(receiverAddr, jsonData) {
    if (!this.node) {
      throw new Error('Node is not initialized. Call initialize() first.');
    }

    const receiverMultiaddr = multiaddr(receiverAddr);
    try {
      const stream = await this.node.dialProtocol(receiverMultiaddr, protocol);
      await jsonToStream(jsonData, stream);
      console.log('JSON data sent');
    } catch (error) {
      console.error('Error sending JSON data:', error);
    }
  }

  /**
   * Sets a listener for incoming messages
   * @param {function} processFunction Function to handle incoming JSON data
   */
  async setNodeListener(processFunction) {
    if (!this.node) {
      await this.initialize();
    }

    this.node.handle(protocol, async ({ stream }) => {
      const jsonData = await streamToJSON(stream);
      processFunction(jsonData);
    });
  }

  /**
   * 
   * @returns {Multiaddr[]} list of multiaddresses for the given node
   */
  getMultiaddrs() {
    if (!this.node) {
      this.initialize().then( () => {
        const addresses = this.node.getMultiaddrs().map((addr) => addr.toString());
        return addresses[addresses.length - 1];
      });
    }
    const addresses = this.node.getMultiaddrs().map((addr) => addr.toString());
    return addresses[addresses.length - 1];
  }
}

export default P2PNode;
