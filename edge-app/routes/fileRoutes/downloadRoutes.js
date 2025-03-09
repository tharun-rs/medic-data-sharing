const express = require("express");
const path = require("path");
const fs = require('fs/promises');
const { downloadFile } = require('../../ipfsConn/FileManager');
const { queryAuthorizationForPatient,
    queryAuthorizationForPatientByFileId,
    queryAuthorizationForAnonymousData
} = require('../../peerAdapter/authorizationContracts');

const router = express.Router();


/**
 * Download Route
 * Expects fileId in the request body
 */
router.post("/authorization/", async (req, res) => {
    try {
        const { patientId, requestor } = req.body;

        const queryResult = await queryAuthorizationForPatient(patientId, requestor);
        console.log(queryResult);

        const downloadDir = "/app/ipfsConn/downloads";
        const fileId = queryResult[0].file_id;
        await downloadFile(fileId, downloadDir);

        // Construct the file path
        const files = await fs.readdir(downloadDir);
        const matchingFile = files.find(file => file.startsWith(fileId));
        if (!matchingFile) {
            return res.status(404).json({ error: "File not found after decryption." });
        }

        const filePath = path.join(downloadDir, matchingFile);

        // Send the file to the client
        res.download(filePath, matchingFile, async (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error sending file" });
            } else {
                // Optional: Delete file after sending to free up space
                await fs.unlink(filePath);
            }
        });

    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
