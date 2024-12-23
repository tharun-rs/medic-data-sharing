import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { unixfs } from '@helia/unixfs';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { tcp } from '@libp2p/tcp';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import { createHelia } from 'helia';
import { createLibp2p } from 'libp2p';

class IPFSNode {
  constructor() {
    this.node = null;
    this.filesystem = null;
  }

  /**
   * Initializes the IPFS node and filesystem
   */
  async initialize() {
    // The blockstore is where we store the blocks that make up files
    const blockstore = new MemoryBlockstore();

    // Application-specific data lives in the datastore
    const datastore = new MemoryDatastore();

    // libp2p is the networking layer that underpins Helia
    const libp2p = await createLibp2p({
      datastore,
      addresses: {
        listen: ['/ip4/127.0.0.1/tcp/0'],
      },
      transports: [tcp()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      peerDiscovery: [
        bootstrap({
          list: [
            '/ip4/127.0.0.1/tcp/4001/p2p/12D3KooWFw8DGQWWe4UHgJbo2vaKtdHgzAB2HuKYqELouHfG7ZDZ',
          ],
        }),
      ],
      services: {
        identify: identify(),
      },
    });

    // Create a Helia node
    this.node = await createHelia({
      datastore,
      blockstore,
      libp2p,
    });

    // Initialize the UnixFS filesystem
    this.filesystem = unixfs(this.node);
  }

  /**
   * Uploads a file to the IPFS node
   * @param {Uint8Array} data - The file data to upload
   * @returns {string} - The CID of the uploaded file
   */
  async uploadFile(data) {
    if (!this.filesystem) {
      this.initialize();
    }

    const cid = await this.filesystem.addBytes(data);
    console.log('File uploaded. CID:', cid.toString());
    return cid.toString();
  }

  /**
   * Downloads a file from the IPFS node
   * @param {string} cid - The CID of the file to download
   * @returns {Uint8Array} - The downloaded file data
   */
  async downloadFile(cid) {
    if (!this.filesystem) {
      throw new Error('IPFS filesystem not initialized. Call initialize() first.');
    }

    const decoder = new TextDecoder();
    let fileData = '';

    for await (const chunk of this.filesystem.cat(cid)) {
      fileData += decoder.decode(chunk, { stream: true });
    }

    console.log('File downloaded. Data:', fileData);
    return fileData;
  }
}

export default IPFSNode;
