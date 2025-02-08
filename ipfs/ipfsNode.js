import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { unixfs } from '@helia/unixfs';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import { tcp } from '@libp2p/tcp';
import { FsDatastore } from 'datastore-fs';
import { FsBlockstore } from 'blockstore-fs';
import { createHelia } from 'helia';
import { createLibp2p } from 'libp2p';
import fs from 'fs';

class IPFSNode {
  constructor() {
    this.node = null;
    this.filesystem = null;
  }

  /**
   * Initializes the IPFS node and filesystem
   */
  async initialize() {
    const blockstorePath = process.env.BLOCKSTORE_PATH;
    const datastorePath = process.env.DATASTORE_PATH;

    // Initialize the blockstore and datastore
    const blockstore = new FsBlockstore(blockstorePath);
    const datastore = new FsDatastore(datastorePath);

    // libp2p is the networking layer that underpins Helia
    const libp2p = await createLibp2p({
        datastore,
        addresses: {
            listen: ['/ip4/0.0.0.0/tcp/4004'],
        },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        peerDiscovery: [
            bootstrap({
                list: [
                    '/ip4/192.168.100.10/tcp/4003/p2p/12D3KooWFw8DGQWWe4UHgJbo2vaKtdHgzAB2HuKYqELouHfG7ZDZ',
                ],
            }),
        ],
        // services: {
        //     identify: identify(),
        // },
    });

    // Create a Helia node
    this.node = await createHelia({
        datastore,
        blockstore,
        libp2p,
    });

    libp2p.addEventListener('peer:discovery', (evt) => {
      console.log('Found peer:', evt.detail.id.toString());
    });
  
    libp2p.addEventListener('peer:connect', (evt) => {
      console.log('Connected to peer:', evt.detail.toString());
    });
  
    libp2p.addEventListener('peer:disconnect', (evt) => {
      console.log('Disconnected from peer:', evt.detail.toString());
    });

    // Initialize the UnixFS filesystem
    this.filesystem = unixfs(this.node);
}

  /**
   * Uploads a file to the IPFS node
   * @param {Uint8Array} data - The file data to upload
   * @returns {string} - The CID of the uploaded file
   */
  async uploadBytes(data) {
    if (!this.filesystem) {
      this.initialize();
    }

    const cid = await this.filesystem.addBytes(data);
    return cid.toString();
  }

  /**
   * Downloads a file from the IPFS node
   * @param {string} cid - The CID of the file to download
   * @returns {Uint8Array} - The downloaded file data
   */
  async downloadBytes(cid) {
    if (!this.filesystem) {
      await this.initialize();  // Ensure initialization is complete before proceeding
    }
  
    const fileChunks = [];
  
    // Collect all chunks from the filesystem
    for await (const chunk of this.filesystem.cat(cid)) {
      fileChunks.push(chunk);
    }
  
    // Combine the chunks into a single Uint8Array
    const totalLength = fileChunks.reduce((total, chunk) => total + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of fileChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
  
    return result;  // Return the combined Uint8Array
  }
  

  /**
   * Uploads a file to the IPFS node from a file path
   * @param {string} filePath - The file path to upload
   * @returns {string} - The CID of the uploaded file
   */
  async uploadFile(filePath) {
    const data = fs.readFileSync(filePath);
    const cid = await this.uploadBytes(new Uint8Array(data));
    await this.node.pins.add(cid);
    return cid;
  }

  /**
   * Downloads a file from the IPFS node and saves it to a file
   * @param {string} cid - The CID of the file to download
   * @param {string} filePath - The path to save the downloaded file
   */
  async downloadFile(cid, filePath) {
    const data = await this.downloadBytes(cid);
    fs.writeFileSync(filePath, data);
  }
}

export default IPFSNode;
