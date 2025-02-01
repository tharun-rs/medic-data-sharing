import fs from 'fs/promises';
import path from 'path';
import { uploadFile, downloadFile } from './FileManager.js';
import { getIPFSKeysCollection } from '../database/models.js';

// Directory setup for testing
const testFilePath = './testfile.txt';
const downloadDirectory = './downloads/';

// Helper function to clean up test files
async function cleanUpTestFiles() {
    try {
        await fs.unlink(testFilePath);
        await fs.rmdir(downloadDirectory, { recursive: true });
        console.log("✅ Test files cleaned up.");
    } catch (err) {
        console.error('Error cleaning up test files:', err);
    }
}

describe('File upload and download (Integration Tests)', () => {
    beforeEach(async () => {
        console.log("⏳ Preparing the test environment...");

        // Prepare the testing environment (ensure directories exist)
        await fs.mkdir(downloadDirectory, { recursive: true });

        // Create a test file to upload
        await fs.writeFile(testFilePath, 'This is a test file for IPFS.');
        console.log("✅ Test file created:", testFilePath);
    });

    afterAll(async () => {
        console.log("🧹 Cleaning up after tests...");
        // Clean up after tests
        await cleanUpTestFiles();
    });

    test('uploadFile should upload a file and store in IPFS and database', async () => {
        console.log("📤 Uploading file:", testFilePath);

        // Upload the file
        const fileId = await uploadFile(testFilePath);

        // Check that the file ID is returned
        expect(fileId).toBeDefined();
        console.log(`✅ File uploaded successfully with fileId: ${fileId}`);

        // Verify that the CID is stored in the database
        const ipfsKeysCollection = await getIPFSKeysCollection();
        const fileMetadata = await ipfsKeysCollection.findOne({ fileId });
        expect(fileMetadata).toBeDefined();
        expect(fileMetadata.cid).toBeDefined();
        expect(fileMetadata.encKey).toBeDefined();
        expect(fileMetadata.iv).toBeDefined();

        console.log("✅ File metadata stored in the database:", fileMetadata);
    });

    test('downloadFile should download a file and decrypt it correctly', async () => {
        console.log("📥 Downloading file...");

        // First, upload a file and get its file ID
        const fileId = await uploadFile(testFilePath);
        console.log(`✅ File uploaded. FileId: ${fileId}`);

        // Download the file to the specified directory
        await downloadFile(fileId, downloadDirectory);
        console.log(`✅ File downloaded to: ${downloadDirectory}`);

        // Check if the file is saved in the download directory
        const downloadedFilePath = path.join(downloadDirectory, `${fileId}.txt`);
        const downloadedFile = await fs.readFile(downloadedFilePath, 'utf-8');
        expect(downloadedFile).toBe('This is a test file for IPFS.');
        console.log("✅ File decrypted correctly:", downloadedFile);

        // Clean up the downloaded file after the test
        await fs.unlink(downloadedFilePath);
        console.log("✅ Downloaded file removed after test.");
    });
});
