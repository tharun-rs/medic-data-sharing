const express = require("express");
const path = require("path");
const { uploadFile } = require('../../ipfsConn/FileManager');
// const { queryAuthorizationForAnonymousData, queryAuthorizationForPatientByFileId, queryAuthorizationForPatient } = require('../../peerAdapter/authorizationContracts');
const p2pNodeManager = require('../../p2pComm/p2pNodeManager');
const crypto = require('crypto');
const fs = require('fs');
const { getAllPHIByFilters, getAllPHIByPatientID, getAllPIIByPatientID } = require("../../peerAdapter/dataUploadContracts");

const router = express.Router();



/**
 * Upload Route
 * Expects a file in the request
 */
router.get("/pii", async (req, res) => {
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
