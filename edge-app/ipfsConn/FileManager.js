const fs = require('fs/promises');
const crypto = require('crypto');
const axios = require('axios');
const { LRUCache } = require('lru-cache');
const path = require('path');
const { getIPFSKeysCollection } = require('../database/models');

// Initialize LRU cache
const cache = new LRUCache({ max: 100 });

/**
 * Upload a file to IPFS.
 * @param {string} filePath - The path to the file to upload.
 * @returns {Promise<string>} - The file ID of the uploaded file.
 */
async function uploadFile(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const rawBytes = new Uint8Array(fileBuffer);
        const aesKey = crypto.randomBytes(32); // 256-bit AES key
        const iv = crypto.randomBytes(16); // 128-bit IV

        const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
        let encryptedData = cipher.update(rawBytes);
        encryptedData = Buffer.concat([encryptedData, cipher.final()]);
        
        const base64Data = encryptedData.toString('base64');

        const response = await axios.post(`${process.env.IPFS_API_URI}/upload`, { fileData: base64Data });
        const cid = response.data.cid;
        if (!cid) throw new Error('Failed to get CID from IPFS server.');

        const fileId = Math.floor(Math.random() * 1e6).toString();
        const extension = path.extname(filePath).substring(1);

        const ipfsKeysCollection = await getIPFSKeysCollection();
        await ipfsKeysCollection.insertOne({
            fileId,
            cid,
            encKey: aesKey.toString('hex'),
            iv: iv.toString('hex'),
            extension,
        });

        const cachedFileName = `${fileId}.${extension}`;
        cache.set(cachedFileName, encryptedData);
        await fs.unlink(filePath);

        return fileId;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

/**
 * Download and decrypt a file from IPFS.
 * @param {string} fileId - The ID of the file to download.
 * @param {string} downloadDirectory - The directory where the file should be saved.
 * @returns {Promise<void>} - The decrypted file will be saved to the downloadDirectory.
 */
async function downloadFile(fileId, downloadDirectory) {
    try {
        const cachedFile = cache.get(fileId);
        if (cachedFile) {
            console.log('File found in cache.');
            return cachedFile;
        }

        const ipfsKeysCollection = await getIPFSKeysCollection();
        const metadata = await ipfsKeysCollection.findOne({ fileId });
        if (!metadata) throw new Error('File metadata not found in the database.');

        const { cid, encKey, iv, extension } = metadata;
        if (!encKey || !iv) throw new Error('Encryption key or IV is missing in metadata.');

        const response = await axios.get(`${process.env.IPFS_API_URI}/download/${cid}`);
        if (!response.data || !response.data.base64Data) throw new Error('No file data returned from IPFS.');

        const encryptedData = Buffer.from(response.data.base64Data, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), Buffer.from(iv, 'hex'));
        let decryptedData = decipher.update(encryptedData);
        decryptedData = Buffer.concat([decryptedData, decipher.final()]);

        const fileName = `${fileId}.${extension}`;
        const filePath = path.join(downloadDirectory, fileName);
        await fs.writeFile(filePath, decryptedData);
        console.log('Downloaded');

        cache.set(fileId, decryptedData);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw new Error('Decryption error. Check key, IV, and encrypted data integrity.');
    }
}

module.exports = { uploadFile, downloadFile };
