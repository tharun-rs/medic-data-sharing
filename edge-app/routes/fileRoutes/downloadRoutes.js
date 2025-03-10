const express = require("express");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');
const { downloadFile, downloadFileWithCID } = require('../../ipfsConn/FileManager');
const { queryAuthorizationForPatient,
    queryAuthorizationForPatientByFileId,
    queryAuthorizationForAnonymousData
} = require('../../peerAdapter/authorizationContracts');
const p2pNodeManager = require('../../p2pComm/p2pNodeManager');
const { getAllPHIByFilters, getAllPHIByPatientID, getAllPIIByPatientID } = require("../../peerAdapter/dataUploadContracts");
const { createPIIAccessRequestWithFileID, queryPIIAccessRequestsByFileID } = require("../../peerAdapter/piiContracts");

const router = express.Router();

async function getFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}


/**
 * Download Route
 * Expects fileId in the request body
 */
router.post("/authorization/patientId", async (req, res) => {
    try {
        const { patientId, requestor } = req.body;

        const queryResult = await queryAuthorizationForPatient(patientId, requestor);
        const downloadDir = "/app/ipfsConn/downloads";
        const fileId = queryResult[0].file_id;

        //file is owned by current organization
        if (requestor === process.env.ORG_NAME) {
            await downloadFile(fileId, downloadDir);


        } else { //file owned by some other organization
            const addr = queryResult[0].custodian_address;
            const { cid, aesKey, iv, extension } = await p2pNodeManager.sendRequest(addr, fileId);
            await downloadFileWithCID(fileId, cid, aesKey, iv, extension);

        }

        // Construct the file path
        const files = await fs.promises.readdir(downloadDir);
        const matchingFile = files.find(file => file.startsWith(fileId));
        if (!matchingFile) {
            return res.status(404).json({ error: "File not found after decryption." });
        }

        const filePath = path.join(downloadDir, matchingFile);

        //if not hash doesnt match raise complaint
        if (requestor !== process.env.ORG_NAME) {
            const calculatedHash = getFileHash(filePath);
            if (queryResult[0].data_hash != calculatedHash) {
                console.log("Raise complaint");
                //implement logic later
            }
        }

        // Send the file to the client
        res.download(filePath, matchingFile, async (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error sending file" });
            } else {
                // Optional: Delete file after sending to free up space
                await fs.promises.unlink(filePath);
            }
        });

    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/pii", async (req, res) => {
    try {
        const { patientId } = req.body;

        const queryResult = await getAllPIIByPatientID(patientId);
        const downloadDir = "/app/ipfsConn/downloads";
        const fileId = queryResult[0].file_id;
        const dataCustodian = queryResult[0].data_custodian;

        //file is owned by current organization
        if (dataCustodian === process.env.ORG_NAME) {
            await downloadFile(fileId, downloadDir);


        } else { //file owned by some other organization

            //raise a access request
            //get node multiaddr
            const nodeMultiAddr = p2pNodeManager.p2pNode.getMultiaddrs();
            await createPIIAccessRequestWithFileID(patientId, fileId, dataCustodian, process.env.ORG_NAME, nodeMultiAddr);

            const addr = queryResult[0].custodian_address;
            const { cid, aesKey, iv, extension } = await p2pNodeManager.sendRequest(addr, fileId, "pii", process.env.ORG_NAME);
            await downloadFileWithCID(fileId, cid, aesKey, iv, extension);

        }

        // Construct the file path
        const files = await fs.promises.readdir(downloadDir);
        const matchingFile = files.find(file => file.startsWith(fileId));
        if (!matchingFile) {
            return res.status(404).json({ error: "File not found after decryption." });
        }

        const filePath = path.join(downloadDir, matchingFile);

        //if not hash doesnt match raise complaint
        if (dataCustodian !== process.env.ORG_NAME) {
            const calculatedHash = await getFileHash(filePath);
            if (queryResult[0].data_hash != calculatedHash) {
                console.log(queryResult[0].data_hash);
                console.log(calculatedHash);
                console.log("Raise complaint");
                //implement logic later
            }
        }

        // Send the file to the client
        res.download(filePath, matchingFile, async (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error sending file" });
            } else {
                // Optional: Delete file after sending to free up space
                await fs.promises.unlink(filePath);
            }
        });

    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
