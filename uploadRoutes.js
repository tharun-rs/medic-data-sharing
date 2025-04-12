const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFile } = require('../../ipfsConn/FileManager');
const { uploadAuthorization } = require('../../peerAdapter/authorizationContracts');
const p2pNodeManager = require('../../p2pComm/p2pNodeManager');
const crypto = require('crypto');
const fs = require('fs');
const { uploadPIIRecord, uploadPHIRecord } = require("../../peerAdapter/dataUploadContracts");

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

const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
    limits: { fileSize: 100 * 1024 * 1024 },
});

const upload = multer({ storage });

/**
 * Common file upload handler for both PII and PHI
 */
async function handleDataUpload(req, res, uploadFunction, additionalParams = {}) {
    try {
        const { patientId } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = req.file.path;

        // Get file hash
        const fileHash = await getFileHash(filePath);

        // Upload file to IPFS
        const fileId = await uploadFile(filePath);

        // Get node multiaddr
        const nodeMultiAddr = p2pNodeManager.p2pNode.getMultiaddrs();

        // Prepare upload parameters
        const uploadParams = {
            patientId,
            fileId,
            dataCustodian: process.env.ORG_NAME,
            custodianAddress: nodeMultiAddr,
            dataHash: fileHash,
            ...additionalParams
        };

        // Create contract record
        const contract = await uploadFunction(uploadParams);
        
        res.json({ 
            message: "File uploaded successfully", 
            fileId, 
            contract 
        });
    } catch (error) {
        console.error("Upload error:", error);
        
        if (error.message.includes("Authorization denied for data custodian")) {
            return res.status(403).json({ 
                error: "Authorization error. Please check authorization contract" 
            });
        }

        res.status(500).json({ 
            error: error.message 
        });
    } finally {
        // Clean up the uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    }
}

/**
 * Authorization Upload Route
 */
router.post("/authorization", upload.single("file"), async (req, res) => {
    try {
        const { patientId, readAccess, writeAccess, anonymousPHIAccess } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filePath = req.file.path;

        // Get file hash
        const fileHash = await getFileHash(filePath);

        // Upload file to IPFS
        const fileId = await uploadFile(filePath);

        // Get node multiaddr
        const nodeMultiAddr = p2pNodeManager.p2pNode.getMultiaddrs();

        // Create contract
        const contract = await uploadAuthorization(
            fileId, 
            patientId, 
            fileHash, 
            process.env.ORG_NAME, 
            nodeMultiAddr, 
            readAccess, 
            writeAccess, 
            anonymousPHIAccess
        );
        
        res.json({ 
            message: "File uploaded successfully", 
            fileId, 
            contract 
        });
    } catch (error) {
        console.error("Authorization upload error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        // Clean up the uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting temp file:", err);
            });
        }
    }
});

/**
 * PII Upload Route
 */
router.post("/pii", upload.single("file"), async (req, res) => {
    await handleDataUpload(req, res, uploadPIIRecord);
});

/**
 * PHI Upload Route (now consistent with PII structure)
 */
router.post("/phi", upload.single("file"), async (req, res) => {
    const { fileType, fileTag } = req.body;
    await handleDataUpload(req, res, uploadPHIRecord, { fileType, fileTag });
});

module.exports = router;