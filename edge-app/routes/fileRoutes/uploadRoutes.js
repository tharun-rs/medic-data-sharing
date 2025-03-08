const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFile } = require('../../ipfsConn/FileManager');
const { uploadAuthorization } = require('../../peerAdapter/authorizationContracts');
const p2pNodeManager = require('../../p2pComm/p2pNodeManager');
const crypto = require('crypto');
const fs = require('fs');

async function getFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

/**
 * Upload Route
 * Expects a file in the request
 */
router.post("/authorization", upload.single("file"), async (req, res) => {
    try {
        
        const { patientId, readAccess, writeAccess, anonymousPHIAccess } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = req.file.path;
        
        //get file hash
        const fileHash = await getFileHash(filePath);

        //upload file to ipfs
        const fileId = await uploadFile(filePath);

        //get node multiaddr
        const nodeMultiAddr = p2pNodeManager.p2pNode.getMultiaddrs();

        //create contract
        const contract = await uploadAuthorization(fileId, patientId, fileHash, process.env.ORG_NAME, nodeMultiAddr, readAccess, writeAccess, anonymousPHIAccess);
        res.json({ message: "File uploaded successfully", fileId, contract });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
