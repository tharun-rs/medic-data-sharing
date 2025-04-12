const express = require("express");
const path = require("path");
const fs = require('fs');
const crypto = require('crypto');
const { downloadFile, downloadFileWithCID } = require('../../ipfsConn/FileManager');
const { queryAuthorizationForPatient } = require('../../peerAdapter/authorizationContracts');
const p2pNodeManager = require('../../p2pComm/p2pNodeManager');
const { getAllPHIByFilters, getAllPHIByPatientID, getAllPIIByPatientID } = require("../../peerAdapter/dataUploadContracts");
const { createPIIAccessRequestWithFileID, queryPIIAccessRequestsByFileID } = require("../../peerAdapter/piiContracts");
const { createPHIAccessRequestWithFileID } = require("../../peerAdapter/phiContracts");

const router = express.Router();
const downloadDir = "/app/ipfsConn/downloads";

async function getFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}

async function downloadAndVerifyFile(fileId, dataCustodian, dataHash, requestor, dataType = null) {
    try {
        // File is owned by current organization
        if (dataCustodian === process.env.ORG_NAME) {
            await downloadFile(fileId, downloadDir);
        } else { // File owned by some other organization
            // For PII/PHI, raise an access request first
            if (dataType) {
                const nodeMultiAddr = p2pNodeManager.p2pNode.getMultiaddrs();
                if (dataType === 'pii') {
                    await createPIIAccessRequestWithFileID(requestor, fileId, dataCustodian, process.env.ORG_NAME, nodeMultiAddr);
                } else if (dataType === 'phi') {
                    await createPHIAccessRequestWithFileID(requestor, fileId, dataCustodian, process.env.ORG_NAME, nodeMultiAddr);
                }
            }
            
            const { cid, aesKey, iv, extension } = await p2pNodeManager.sendRequest(dataCustodian, fileId, dataType, process.env.ORG_NAME);
            await downloadFileWithCID(fileId, cid, aesKey, iv, extension);
        }

        // Find the downloaded file
        const files = await fs.promises.readdir(downloadDir);
        const matchingFile = files.find(file => file.startsWith(fileId));
        if (!matchingFile) {
            throw new Error("File not found after decryption.");
        }

        const filePath = path.join(downloadDir, matchingFile);

        // Verify hash if file is from another organization
        if (dataCustodian !== process.env.ORG_NAME && dataHash) {
            const calculatedHash = await getFileHash(filePath);
            if (dataHash !== calculatedHash) {
                console.log("Hash mismatch detected:", { expected: dataHash, actual: calculatedHash });
                // Implement complaint logic here
            }
        }

        return { filePath, fileName: matchingFile };
    } catch (error) {
        console.error(`Error processing file ${fileId}:`, error);
        throw error;
    }
}

async function handleSingleFileDownload(res, fileRecord, requestor, dataType = null) {
    try {
        const { filePath, fileName } = await downloadAndVerifyFile(
            fileRecord.file_id, 
            fileRecord.data_custodian, 
            fileRecord.data_hash, 
            requestor, 
            dataType
        );

        res.download(filePath, fileName, async (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Clean up file after sending
            await fs.promises.unlink(filePath).catch(console.error);
        });
    } catch (error) {
        throw error;
    }
}

async function handleMultipleFilesDownload(res, fileRecords, requestor, dataType = null) {
    try {
        const downloadPromises = fileRecords.map(record => 
            downloadAndVerifyFile(
                record.file_id, 
                record.data_custodian, 
                record.data_hash, 
                requestor, 
                dataType
            )
        );

        const downloadedFiles = await Promise.all(downloadPromises);
        
        // Create a zip file containing all downloaded files
        const archiver = require('archiver');
        const zipFileName = `patient_files_${Date.now()}.zip`;
        const zipFilePath = path.join(downloadDir, zipFileName);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            res.download(zipFilePath, zipFileName, async (err) => {
                if (err) {
                    console.error("Error sending zip file:", err);
                }
                // Clean up all files
                await Promise.all([
                    ...downloadedFiles.map(file => fs.promises.unlink(file.filePath).catch(console.error)),
                    fs.promises.unlink(zipFilePath).catch(console.error)
                ]);
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        downloadedFiles.forEach(file => {
            archive.file(file.filePath, { name: file.fileName });
        });
        archive.finalize();
    } catch (error) {
        throw error;
    }
}

// Authorization-based download
router.post("/authorization/patientId", async (req, res) => {
    try {
        const { patientId, requestor, singleFile } = req.body;
        const queryResult = await queryAuthorizationForPatient(patientId, requestor);

        if (queryResult.length === 0) {
            return res.status(404).json({ error: "No files found for this patient" });
        }

        if (singleFile || queryResult.length === 1) {
            await handleSingleFileDownload(res, queryResult[0], requestor);
        } else {
            await handleMultipleFilesDownload(res, queryResult, requestor);
        }
    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: error.message });
    }
});

// PII download
router.post("/pii", async (req, res) => {
    try {
        const { patientId, singleFile } = req.body;
        const queryResult = await getAllPIIByPatientID(patientId);

        if (queryResult.length === 0) {
            return res.status(404).json({ error: "No PII files found for this patient" });
        }

        if (singleFile || queryResult.length === 1) {
            await handleSingleFileDownload(res, queryResult[0], patientId, 'pii');
        } else {
            await handleMultipleFilesDownload(res, queryResult, patientId, 'pii');
        }
    } catch (error) {
        console.error("Error downloading PII files:", error);
        
        if (error.message.includes("Authorization denied for data custodian")) {
            return res.status(403).json({ error: "Authorization error. Please check authorization contract" });
        }

        res.status(500).json({ error: error.message });
    }
});

// PHI download
router.post("/phi", async (req, res) => {
    try {
        const { patientId, singleFile } = req.body;
        const queryResult = await getAllPHIByPatientID(patientId);

        if (queryResult.length === 0) {
            return res.status(404).json({ error: "No PHI files found for this patient" });
        }

        if (singleFile || queryResult.length === 1) {
            await handleSingleFileDownload(res, queryResult[0], patientId, 'phi');
        } else {
            await handleMultipleFilesDownload(res, queryResult, patientId, 'phi');
        }
    } catch (error) {
        console.error("Error downloading PHI files:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;