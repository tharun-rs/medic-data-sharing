const { getIPFSKeysCollection } = require('../database/models');
const crypto = require('crypto');
const P2PNode = require('./p2pNode');

class P2PNodeManager {
  constructor() {
    this.p2pNode = null;

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
    this.p2pNode = new P2PNode();
    await this.p2pNode.initialize();
    await this.p2pNode.setNodeListener(this.sendResponse.bind(this));
  }

  async sendResponse(jsonData) {
    const type = jsonData.type;

    if (type === "request") {
      const { fileId, rsa_key: requesterPublicKey } = jsonData;
      try {
        const ipfsCollection = await getIPFSKeysCollection();
        const fileRecord = await ipfsCollection.findOne({ fileId });

        if (!fileRecord) {
          console.error(`File with ID ${fileId} not found.`);
          return;
        }

        const { encKey: aesKey, iv, cid, extension } = fileRecord;
        
        const encryptedAesKey = crypto.publicEncrypt(
          requesterPublicKey,
          Buffer.from(aesKey, 'utf-8')
        );

        const encryptedIV = crypto.publicEncrypt(
          requesterPublicKey,
          Buffer.from(iv, 'utf-8')
        );

        const encryptedCid = crypto.publicEncrypt(
          requesterPublicKey,
          Buffer.from(cid, 'utf-8')
        );

        this.p2pNode.sendToNode(jsonData.address, {
          fileId,
          aes_key: encryptedAesKey.toString('base64'),
          iv: encryptedIV.toString('base64'),
          cid: encryptedCid.toString('base64'),
          extension,
          type: "response",
        });
      } catch (error) {
        console.error(`Error handling request for fileId ${fileId}:`, error);
      }
    }

    if (type === "response") {
      try {
        const decryptedAesKey = crypto.privateDecrypt(
          this.rsaPrivateKey,
          Buffer.from(jsonData.aes_key, 'base64')
        ).toString('utf-8');

        const decryptedIV = crypto.privateDecrypt(
          this.rsaPrivateKey,
          Buffer.from(jsonData.iv, 'base64')
        ).toString('utf-8');

        const decryptedCid = crypto.privateDecrypt(
          this.rsaPrivateKey,
          Buffer.from(jsonData.cid, 'base64')
        ).toString('utf-8');

        if (this.pendingRequests.has(jsonData.fileId)) {
          this.pendingRequests.get(jsonData.fileId).resolve({
            iv: decryptedIV,
            aesKey: decryptedAesKey,
            cid: decryptedCid,
            extension: jsonData.extension,
          });
          this.pendingRequests.delete(jsonData.fileId);
        }
      } catch (error) {
        console.error("Error decrypting response data:", error);
        if (this.pendingRequests.has(jsonData.fileId)) {
          this.pendingRequests.get(jsonData.fileId).reject({
            message: error,
          });
          this.pendingRequests.delete(jsonData.fileId);
        }
      }
    }
  }

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

const p2pNodeManager = new P2PNodeManager();
(async () => {
    try {
        await p2pNodeManager.initialize();
        console.log("P2P Node is ready to handle requests.");
    } catch (error) {
        console.error("Failed to initialize P2P Node:", error);
    }
})();
module.exports = p2pNodeManager;
