const fs = require('fs/promises');
const crypto = require('crypto');
const axios = require('axios');
const { LRUCache } = require('lru-cache');
const path = require('path');
const { getIPFSKeysCollection } = require('../database/models');

const downloadsDir = path.join(__dirname, 'downloads');

// Ensure the downloads directory exists
async function ensureDownloadDir() {
    try {
        await fs.mkdir(downloadsDir, { recursive: true });
    } catch (error) {
        console.error('Failed to create downloads directory:', error);
    }
}

// Initialize LRU cache with disposal function to clean up files
const cache = new LRUCache({
    max: 100,
    dispose: async (fileId, filePath) => {
        try {
            await fs.unlink(filePath);
            console.log(`Removed obsolete file: ${filePath}`);
        } catch (error) {
            console.error(`Failed to remove file ${filePath}:`, error);
        }
    }
});

// Cleanup old files on startup
async function cleanupObsoleteFiles() {
    try {
        const files = await fs.readdir(downloadsDir);
        for (const file of files) {
            const filePath = path.join(downloadsDir, file);
            if (![...cache.values()].includes(filePath)) {
                await fs.unlink(filePath);
                console.log(`Deleted old file: ${filePath}`);
            }
        }
    } catch (error) {
        console.error('Error cleaning up obsolete files:', error);
    }
}

ensureDownloadDir();
cleanupObsoleteFiles();

async function uploadFile(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const aesKey = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
        let encryptedData = cipher.update(fileBuffer);
        encryptedData = Buffer.concat([encryptedData, cipher.final()]);

        const base64Data = encryptedData.toString('base64');
        const response = await axios.post(`${process.env.IPFS_API_URI}/upload`, { fileData: base64Data });
        const cid = response.data.cid;
        if (!cid) throw new Error('Failed to get CID from IPFS server.');

        const fileId = crypto.randomBytes(6).toString('hex');
        const extension = path.extname(filePath).substring(1);

        const ipfsKeysCollection = await getIPFSKeysCollection();
        await ipfsKeysCollection.insertOne({
            fileId,
            cid,
            encKey: aesKey.toString('hex'),
            iv: iv.toString('hex'),
            extension,
        });

        await fs.unlink(filePath);
        return fileId;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function downloadFile(fileId) {
    try {
        if (cache.has(fileId)) {
            console.log('File found in cache.');
            return cache.get(fileId);
        }

        const ipfsKeysCollection = await getIPFSKeysCollection();
        const metadata = await ipfsKeysCollection.findOne({ fileId });
        if (!metadata) throw new Error('File metadata not found.');

        const { cid, encKey, iv, extension } = metadata;
        if (!encKey || !iv) throw new Error('Encryption key or IV is missing.');

        const response = await axios.get(`${process.env.IPFS_API_URI}/download/${cid}`);
        if (!response.data || !response.data.base64Data) throw new Error('No file data returned from IPFS.');

        const encryptedData = Buffer.from(response.data.base64Data, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), Buffer.from(iv, 'hex'));
        let decryptedData = decipher.update(encryptedData);
        decryptedData = Buffer.concat([decryptedData, decipher.final()]);

        const fileName = `${fileId}.${extension}`;
        const filePath = path.join(downloadsDir, fileName);
        await fs.writeFile(filePath, decryptedData);
        console.log(`File downloaded: ${filePath}`);

        cache.set(fileId, filePath);
        return filePath;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

async function downloadFileWithCID(fileId, cid, encKey, iv, extension) {
    try {
        const response = await axios.get(`${process.env.IPFS_API_URI}/download/${cid}`);
        if (!response.data || !response.data.base64Data) throw new Error('No file data returned from IPFS.');

        const encryptedData = Buffer.from(response.data.base64Data, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), Buffer.from(iv, 'hex'));
        let decryptedData = decipher.update(encryptedData);
        decryptedData = Buffer.concat([decryptedData, decipher.final()]);

        const fileName = `${fileId}.${extension}`;
        const filePath = path.join(downloadsDir, fileName);
        await fs.writeFile(filePath, decryptedData);
        console.log(`File downloaded: ${filePath}`);

        cache.set(fileId, filePath);
        return filePath;
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

module.exports = { uploadFile, downloadFile, downloadFileWithCID };
