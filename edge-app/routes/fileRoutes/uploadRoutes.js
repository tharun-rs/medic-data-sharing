const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFile } = require('../../ipfsConn/FileManager');
const { uploadAuthorization } = require('../../peerAdapter/authorizationContracts');
// const { uploadAuthorization } = require('../../peerAdapter/mockContracts');
const p2pNodeManager = require('../../p2pComm/p2pNodeManager');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const { uploadPIIRecord, uploadPHIRecord } = require("../../peerAdapter/dataUploadContracts");
// const { uploadPIIRecord, uploadPHIRecord } = require("../../peerAdapter/mockContracts");

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
    limits: { fileSize: 200 * 1024 * 1024 },
});

const upload = multer({ storage });


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

        let backupDir, tempCopyPath;
        //get file hash
        const fileHash = await getFileHash(filePath);

        if (process.env.INCLUDE_BASE_METHOD_UPLOAD) {
            backupDir = './backup'
            await fsp.mkdir(backupDir, { recursive: true });
            const fileName = path.basename(filePath);
            tempCopyPath = path.join(backupDir, fileName);
            await fsp.copyFile(filePath, tempCopyPath);
        }

        //upload file to ipfs
        const fileId = await uploadFile(filePath);

        if (process.env.INCLUDE_BASE_METHOD_UPLOAD) {
            const finalPath = path.join(backupDir, `${fileId}.txt`);
            await fsp.rename(tempCopyPath, finalPath);
        }

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


router.post("/pii", upload.single("file"), async (req, res) => {
    try {

        const { patientId } = req.body;
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
        const contract = await uploadPIIRecord(patientId, fileId, process.env.ORG_NAME, nodeMultiAddr, fileHash);
        res.json({ message: "File uploaded successfully", fileId, contract });
    } catch (error) {
        console.log(error);

        if (error.message.includes("Authorization denied for data custodian")) {
            return res.status(403).json({ error: "Authorization error. Please check authorization contract" });
        }

        res.status(500).json({ error: error.message });
    }

});



router.post("/phi", upload.single("file"), async (req, res) => {
    try {

        const { patientId, fileType, fileTag } = req.body;
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
        const contract = await uploadPHIRecord(patientId, fileId, process.env.ORG_NAME, nodeMultiAddr, fileType, fileTag, fileHash);
        res.json({ message: "File uploaded successfully", fileId, contract });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
