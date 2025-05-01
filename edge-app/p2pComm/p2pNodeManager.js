const { getIPFSKeysCollection } = require('../database/models');
const crypto = require('crypto');
const P2PNode = require('./p2pNode');
const { getAllPIIByPatientID } = require('../peerAdapter/dataUploadContracts');
const { queryPIIAccessRequestsByFileID } = require('../peerAdapter/piiContracts');
const { error } = require('console');
const { queryPHIAccessRequestsByFileId } = require('../peerAdapter/phiContracts');
const fs = require('fs').promises;
const path = require('path');

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

  async verifyPIIAcessRequest(requestor, fileId) {

  }

  async sendResponse(jsonData) {
    const type = jsonData.type;
    const method = jsonData.method;
    if (method === "base") {
      const backupDir = "./backup"
      if (type === "request") {
        const { fileId } = jsonData;
        const filePath = path.join(backupDir, `${fileId}.txt`);

        try {
          const fileBuffer = await fs.readFile(filePath);
          const base64File = fileBuffer.toString('base64');

          this.p2pNode.sendToNode(jsonData.address, {
            type: "response",
            method: "base",
            fileId,
            file: base64File,
          });
        } catch (err) {
          console.error(`Error reading or sending file ${fileId}:`, err);
          this.p2pNode.sendToNode(jsonData.address, {
            type: "response",
            method: "base",
            fileId,
            error: "File not found or could not be read",
          });
        }
      }

      if (type === "response") {
        const { fileId, file, error } = jsonData;
        if (error) {
          console.error(`Received error for fileId ${fileId}:`, error);
          return;
        }

        const fileBuffer = Buffer.from(file, 'base64');
        const filePath = path.join(backupDir, `${fileId}.txt`);

        try {
          await fs.mkdir(backupDir, { recursive: true });
          await fs.writeFile(filePath, fileBuffer);
          console.log(`File ${fileId}.txt written successfully.`);
        } catch (err) {
          console.error(`Error writing file ${fileId}.txt:`, err);
        }

        if (this.pendingRequests.has(jsonData.fileId+"base")) {
          this.pendingRequests.get(jsonData.fileId+"base").resolve({
            fileid: fileId
          });
          this.pendingRequests.delete(jsonData.fileId+"base");
        }
      }
    }

    if (type === "request") {
      const { fileId, rsa_key: requesterPublicKey, fileType, requestor } = jsonData;
      let requestor_address;
      requestor_address = jsonData.address;
      try {
        if (fileType === "pii") {
          const response = await queryPIIAccessRequestsByFileID(fileId);
          const matchedRecord = response.find(record => record.requestor === requestor);
          if (matchedRecord) {
            requestor_address = matchedRecord.requestor_address;
          } else {
            throw Error("Access not available");
          }
        }
        else if (fileType === "phi") {
          const response = await queryPHIAccessRequestsByFileId(fileId);
          const matchedRecord = response.find(record => record.requestor === requestor);
          if (matchedRecord) {
            requestor_address = matchedRecord.requestor_address;
          } else {
            throw Error("Access not available");
          }
        }
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

        this.p2pNode.sendToNode(requestor_address, {
          fileId,
          aes_key: encryptedAesKey.toString('base64'),
          iv: encryptedIV.toString('base64'),
          cid: encryptedCid.toString('base64'),
          extension,
          type: "response",
        });
      } catch (error) {
        console.error(`Error handling request for fileId ${fileId}:`, error);
        this.p2pNode.sendToNode(requestor_address, {
          error
        });
      }
    }

    if (type === "response") {
      try {
        if (jsonData.error) {
          throw error;
        }
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

  async sendRequest(receiverAddr, fileId, fileType = "auth", requestor = "") {
    const requestPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(fileId, { resolve, reject });
    });

    this.p2pNode.sendToNode(receiverAddr, {
      fileId: fileId,
      address: this.p2pNode.getMultiaddrs(),
      rsa_key: this.rsaPublicKey,
      fileType,
      requestor,
      type: "request",
    });

    return requestPromise;
  }

  async sendRequestBaseMethod(receiverAddr, fileId, fileType = "auth", requestor = "") {
    const requestPromise = new Promise((resolve, reject) => {
      this.pendingRequests.set(fileId+"base", { resolve, reject });
    });

    this.p2pNode.sendToNode(receiverAddr, {
      fileId: fileId,
      address: this.p2pNode.getMultiaddrs(),
      rsa_key: this.rsaPublicKey,
      fileType,
      requestor,
      type: "request",
      method: "base",
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
