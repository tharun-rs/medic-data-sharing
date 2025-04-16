import { downloadPIIFile, downloadFromIPFS } from "./downloadtest.js";
import { uploadAuthorization, uploadPII, generateRandomFile, uploadFileToIPFS } from "./uploadtest.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

async function testfileUpload(){
    console.log("Uploading auth file for org1 to upload data:");
    console.log(`Expected response: {
    message: 'File uploaded successfully',
    fileId: '<somefileid>',
    contract: 'composite contract id key'
}`);

    console.log("Actual response: ");
    await uploadAuthorization("./sampleFiles/contract_upload.txt", 3000, "patient01", false, true, false);
}

async function testBlockingUploadOnNonAUthorized() {
    console.log("Uploading pii file for patient02 without authorization to upload data");
    console.log(`Expected respone: 
Error: message=Authorization denied for data custodian: Org1`);
    console.log("Actual Response: ");
    await uploadPII("./sampleFiles/pii.txt", 3000, "patient02", false, true, false);
}

async function testSuccessfullPIIUpload() {
    console.log("Uploading pii file for patient01 with authorization to upload data");
    console.log(`Expected response: {
    message: 'File uploaded successfully',
    fileId: '<somefileid>',
    contract: 'composite contract id key'
}`);
    console.log("Actual Response: ");
    await uploadPII("./sampleFiles/pii.txt", 3000, "patient01", false, true, false);
    
}

async function testDownloadPIIWithoutAuth(){
    console.log("Downloading pii file for patient01 from org2 without authorization to download data");
    console.log(`Expected response: Error= message=Authorization denied`);
    console.log("Actual Response: ");
    await downloadPIIFile("patient01","./downloads/pii.txt",3001);
}

async function testDownloadPIIWithAuth(){
    console.log("Downloading pii file for patient01 from org2 after authorization to download data");
    await uploadAuthorization("./sampleFiles/contract_download.txt", 3001, "patient01", true, false, false);
    console.log(`Expected response File downloaded successfully: ./downloads/pii_file.txt`);
    console.log("Actual Response: ");
    await downloadPIIFile("patient01","./downloads/pii.txt",3001);
}

let cid;
async function testUploadToIPFS() {
    console.log("Uploading file to IPFS");
    console.log(`Expected response: {
    message: 'File uploaded successfully',
    cid: '<somecid>'
}`);
    console.log("Actual Response: ");
    try {
        cid = await uploadFileToIPFS("./sampleFiles/pii.txt", 3003);
    } catch (error) {
        console.error("Error uploading to IPFS:", error);
    }
}

async function testDownloadFromIPFS() {
    console.log("Downloading file from IPFS");
    console.log(`Expected response: {
    message: 'File downloaded successfully',
    filePath: './downloads/testfile.txt'
}`);
    console.log("Actual Response: ");
    await downloadFromIPFS(cid, 3003, "./downloads/testfile.txt");
}

async function compareFiles() {
    console.log("Comparing files from IPFS and local storage");
    console.log(`Expected response: Files are identical`);
    console.log("Actual Response: ");
    const originalFilePath = "./sampleFiles/pii.txt";
    const downloadedFilePath = "./downloads/testfile.txt";
    const originalFile = fs.readFileSync(originalFilePath);
    const downloadedFile = fs.readFileSync(downloadedFilePath);

    const originalHash = crypto.createHash('sha256').update(originalFile).digest('hex');
    const downloadedHash = crypto.createHash('sha256').update(downloadedFile).digest('hex');

    if (originalHash === downloadedHash) {
        console.log("Files are identical.");
    } else {
        console.log("Files are different.");
    }
}

async function testDownloadFromIPFSFailure() {
    console.log("Downloading file from IPFS with invalid CID");
    console.log(`Expected response: Error= message=Invalid CID`);
    console.log("Actual Response: ");
    try {
        await downloadFromIPFS("invalid_cid", 3002);
    } catch (error) {
        console.error("Error downloading from IPFS: No file with CID found");
    }
}


(async () => {
    // console.log("Test 1:");
    // await testfileUpload();
    // console.log("_______________________________________________\n\n");


    // console.log("Test 2:");
    // await testBlockingUploadOnNonAUthorized();
    // console.log("_______________________________________________\n\n");


    // console.log("Test 3:");
    // await testSuccessfullPIIUpload();
    // console.log("_______________________________________________\n\n");

    // console.log("Test 4:");
    // await testDownloadPIIWithoutAuth();
    // console.log("_______________________________________________\n\n");

    // console.log("Test 5:");
    // await testDownloadPIIWithAuth();
    // console.log("_______________________________________________\n\n");

    console.log("Test 6:");
    await testUploadToIPFS();
    console.log("_______________________________________________\n\n");

    console.log("Test 7:");
    await testDownloadFromIPFS();
    console.log("_______________________________________________\n\n");

    console.log("Test 8:");
    await compareFiles();
    console.log("_______________________________________________\n\n");

    console.log("Test 9:");
    await testDownloadFromIPFSFailure();
    console.log("_______________________________________________\n\n");
})();

