import { getIPFSKeysCollection } from '../database/models.js';
import crypto from 'crypto';
import P2PNode from './p2pNode.js';

class p2pNodeManager {
  constructor() {
    // Create a new P2PNode instance
    this.p2pNode = null;

    //generate rsa key
    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.rsaPublicKey = publicKey;
    this.rsaPrivateKey = privateKey;
    this.pendingRequests = new Map();
  }

  async initialize() {
    this.p2pNode = await new P2PNode();
    await this.p2pNode.initialize();
    await this.p2pNode.setNodeListener(this.sendResponse.bind(this));
  }

  /**
   * Method to handle incoming JSON data
   * This will be called whenever a message is received by the P2PNode.
   * @param {JSON} jsonData The incoming JSON data
   */
  async sendResponse(jsonData) {
    const type = jsonData.type;

    if (type === "request") {
      const { fileId, rsa_key: requesterPublicKey } = jsonData;

      try {
        // Fetch the document from the database using fileId
        const ipfs_collection = await getIPFSKeysCollection()
        const fileRecord = await ipfs_collection.findOne({ fileId });

        if (!fileRecord) {
          console.error(`File with ID ${fileId} not found.`);
          return;
        }

        const { aesKey, cid } = fileRecord;

        //console.log(aesKey);
        // Encrypt the AES key and CID using the requester's public RSA key
        const encryptedAesKey = crypto.publicEncrypt(
          requesterPublicKey,
          Buffer.from(aesKey, 'utf-8')
        );

        const encryptedCid = crypto.publicEncrypt(
          requesterPublicKey,
          Buffer.from(cid, 'utf-8')
        );

        // Send the encrypted response back to the requester
        this.p2pNode.sendToNode(jsonData.address, {
          fileId,
          aes_key: encryptedAesKey.toString('base64'),
          cid: encryptedCid.toString('base64'),
          type: "response",
        });
      } catch (error) {
        console.error(`Error handling request for fileId ${fileId}:`, error);
      }
    }

    if (type === "response") {
      try {
        // Decrypt the CID and AES key using the private RSA key
        const decryptedAesKey = crypto.privateDecrypt(
          this.rsaPrivateKey,
          Buffer.from(jsonData.aes_key, 'base64')
        ).toString('utf-8');

        const decryptedCid = crypto.privateDecrypt(
          this.rsaPrivateKey,
          Buffer.from(jsonData.cid, 'base64')
        ).toString('utf-8');

        // todo : make IPFS call using decryptedCid and decryptedAesKey
        // Notify waiting Promises for the fileId
        if (this.pendingRequests.has(jsonData.fileId)) {
          this.pendingRequests.get(jsonData.fileId).resolve({ 
            aesKey: decryptedAesKey, 
            cid: decryptedCid 
          });
          this.pendingRequests.delete(jsonData.fileId);
        }

      } catch (error) {
        console.error("Error decrypting response data:", error);
        if (this.pendingRequests.has(jsonData.fileId)) {
          this.pendingRequests.get(jsonData.fileId).reject({ 
            message: error
          });
          this.pendingRequests.delete(jsonData.fileId);
        }
      }
    }
  }

  /**
   * Sends a request to another peer
   * @param {String} receiverAddr Multiaddress of the peer to send the request to
   * @param {String} fileId FileID of the file to be requested
   * @returns {Promise} promise of the requested fileId
   */
  async sendRequest(receiverAddr, fileId) {
    const requestPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(fileId, { resolve, reject });
    });

    this.p2pNode.sendToNode(receiverAddr, {
      fileId: fileId,
      address: this.p2pNode.getMultiaddrs(),
      rsa_key: this.rsaPublicKey,
      type: "request",
    });

    return requestPromise;
  }

}

export default p2pNodeManager;
