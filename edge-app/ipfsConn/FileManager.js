import { getIPFSKeysCollection } from '../database/models';

class FileManager {
    constructor(cache) {
        this.cache = cache;
    }

    async uploadFile(filePath) {
        /**
         * Upload a file to IPFS.
         *
         * @param {string} filePath - The path to the file to upload.
         * @returns {Promise<string>} - The File ID.
         */     
    }

    async downloadFile(cid, encKey) {
        /**
         * Download a file from IPFS.
         *
         * @param {string} cid - The content identifier (CID) of the file to download.
         * @param {string} encKey - The AES key needed to decrypt
         * @returns {Promise<string>} - The File ID.
         */
    }
}