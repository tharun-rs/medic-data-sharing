import fs from 'fs/promises';
import crypto from 'crypto';
import axios from 'axios';
import { LRUCache } from 'lru-cache';
import path from 'path';
import { getIPFSKeysCollection } from '../database/models.js';

// Initialize LRU cache
const cache = new LRUCache({ max: 100 });

/**
 * Upload a file to IPFS.
 * @param {string} filePath - The path to the file to upload.
 * @returns {Promise<string>} - The file ID of the uploaded file.
 */
export async function uploadFile(filePath) {
    try {
        // Read the file from the filePath
        const fileBuffer = await fs.readFile(filePath);

        // Convert file to raw bytes
        const rawBytes = new Uint8Array(fileBuffer);

        // Generate AES key
        const aesKey = crypto.randomBytes(32); // 256-bit AES key

        // Generate IV (Initialization Vector)
        const iv = crypto.randomBytes(16); // 128-bit IV

        // Encrypt the raw bytes using AES
        const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
        let encryptedData = cipher.update(rawBytes);
        encryptedData = Buffer.concat([encryptedData, cipher.final()]);

        // Convert encrypted data to Base64 encoded string
        const base64Data = encryptedData.toString('base64');

        // Make a POST request to IPFS server
        const response = await axios.post(`${process.env.IPFS_API_URI}/upload`, {
            fileData: base64Data,
        });

        const cid = response.data.cid;
        if (!cid) {
            throw new Error('Failed to get CID from IPFS server.');
        }

        // Generate a random file ID
        // todo: include logic for fileId generation
        const fileId = Math.floor(Math.random() * 1e6).toString();

        // Get the file extension
        const extension = path.extname(filePath).substring(1);

        // Store the CID, AES key, and IV in the database
        const ipfsKeysCollection = await getIPFSKeysCollection();
        await ipfsKeysCollection.insertOne({
            fileId,
            cid,
            encKey: aesKey.toString('hex'), 
            iv: iv.toString('hex'),         
            extension,
        });

        // Save the file to LRU cache in fileId.extension format
        const cachedFileName = `${fileId}.${extension}`;
        cache.set(cachedFileName, encryptedData);

        // Remove the file from the filePath
        await fs.unlink(filePath);

        // Return the file ID
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


export async function downloadFile(fileId, downloadDirectory) {
    try {
        // Check if the file is in the cache
        const cachedFile = cache.get(fileId);
        if (cachedFile) {
            console.log('File found in cache.');
            return cachedFile;
        }

        // Fetch metadata from the database
        const ipfsKeysCollection = await getIPFSKeysCollection();
        const metadata = await ipfsKeysCollection.findOne({ fileId });
        if (!metadata) {
            throw new Error('File metadata not found in the database.');
        }

        const { cid, encKey, iv, extension } = metadata;
        console.log(metadata);
        // Check if encKey and iv are valid
        if (!encKey || !iv) {
            throw new Error('Encryption key or IV is missing in metadata.');
        }

        // Download encrypted data from IPFS
        const response = await axios.get(`${process.env.IPFS_API_URI}/download/${cid}`);
        


        // Check if base64Data is present in the response
        if (!response.data || !response.data.base64Data) {
            throw new Error('No file data returned from IPFS.');
        }

        const base64Data = response.data.base64Data;

        // Decode Base64 to get encrypted data
        const encryptedData = Buffer.from(base64Data, 'base64');

        // Decrypt the data
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encKey, 'hex'), Buffer.from(iv, 'hex'));
        let decryptedData = decipher.update(encryptedData);
        decryptedData = Buffer.concat([decryptedData, decipher.final()]);

        // Save the decrypted file to the specified directory
        const fileName = `${fileId}.${extension}`;
        const filePath = path.join(downloadDirectory, fileName);
        console.log(filePath);
        console.log(decryptedData);
        await fs.writeFile(filePath, decryptedData);
        console.log("Downloaded");

        // Save the file to cache
        cache.set(fileId, decryptedData);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw new Error('Decryption error. Check key, IV, and encrypted data integrity.');
    }
}