const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFile, downloadFile } = require('../../ipfsConn/FileManager');

const router = express.Router();

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

/**
 * Upload Route
 * Expects a file in the request
 */
router.post("/upload/authorization", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const fileId = await uploadFile(filePath);

        res.json({ message: "File uploaded successfully", fileId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Download Route
 * Expects fileId in the request body
 */
router.post("/download", async (req, res) => {
    try {
        const { fileId } = req.body;
        if (!fileId) {
            return res.status(400).json({ error: "fileId is required" });
        }

        const downloadDir = path.join(__dirname, "../downloads");
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
