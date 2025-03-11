import { downloadPIIFile } from "./downloadtest.js";
import { uploadAuthorization, uploadPII } from "./uploadtest.js";

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

(async () => {
    console.log("Test 1:");
    await testfileUpload();
    console.log("_______________________________________________\n\n");


    console.log("Test 2:");
    await testBlockingUploadOnNonAUthorized();
    console.log("_______________________________________________\n\n");


    console.log("Test 3:");
    await testSuccessfullPIIUpload();
    console.log("_______________________________________________\n\n");

    console.log("Test 4:");
    await testDownloadPIIWithoutAuth();
    console.log("_______________________________________________\n\n");

    console.log("Test 5:");
    await testDownloadPIIWithAuth();
    console.log("_______________________________________________\n\n");
})();

