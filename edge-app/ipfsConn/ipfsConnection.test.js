import fs from 'fs/promises';
import path from 'path';
import { uploadFile, downloadFile } from './FileManager.js';
import { getIPFSKeysCollection } from '../database/models.js';

// Directory setup for testing
const testFilePath = './testfile.txt';
const downloadDirectory = './downloads/';

// Helper function to clean up test files
async function cleanUpTestFiles() {
    // try {
    //     await fs.unlink(testFilePath);
    //     await fs.rmdir(downloadDirectory, { recursive: true });
    // } catch (err) {
    //     console.error('Error cleaning up test files:', err);
    // }
}

describe('File upload and download (Integration Tests)', () => {
    beforeEach(async () => {
        // Prepare the testing environment (ensure directories exist)
        await fs.mkdir(downloadDirectory, { recursive: true });

        // Create a test file to upload
        await fs.writeFile(testFilePath, 'This is a test file for IPFS.');
    });

    afterAll(async () => {
        // Clean up after tests
        await cleanUpTestFiles();
    });

    test('uploadFile should upload a file and store in IPFS and database', async () => {
        // Upload the file
        const fileId = await uploadFile(testFilePath);

        // Check that the file ID is returned
        expect(fileId).toBeDefined();

        // Verify that the CID is stored in the database
        const ipfsKeysCollection = await getIPFSKeysCollection();
        const fileMetadata = await ipfsKeysCollection.findOne({ fileId });
        expect(fileMetadata).toBeDefined();
        expect(fileMetadata.cid).toBeDefined();
        expect(fileMetadata.encKey).toBeDefined();
        expect(fileMetadata.iv).toBeDefined();
    });

    test('downloadFile should download a file and decrypt it correctly', async () => {
        // First, upload a file and get its file ID
        const fileId = await uploadFile(testFilePath);

        // Download the file to the specified directory
        await downloadFile(fileId, downloadDirectory);

        // Check if the file is saved in the download directory
        const downloadedFilePath = path.join(downloadDirectory, `${fileId}.txt`);
        const downloadedFile = await fs.readFile(downloadedFilePath, 'utf-8');
        expect(downloadedFile).toBe('This is a test file for IPFS.');

        // Clean up the downloaded file after the test
        await fs.unlink(downloadedFilePath);
    });
});
