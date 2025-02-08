import { uploadFile, downloadFile } from "./FileManager.js";
import readline from 'readline';

// Create an interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to handle user input for upload or download
async function getUserInput() {
  rl.question('Do you want to upload or download a file? (Enter "upload" or "download"): ', async (action) => {
    switch (action.toLowerCase()) {
      case 'download':
        rl.question('Enter the file ID to download: ', async (fileId) => {
          // Await downloadFile function with the fileId
          await downloadFile(fileId, "./");
          rl.close();
        });
        break;

      case 'upload':
        rl.question('Enter the file path to upload: ', async (filePath) => {
          // Await uploadFile function with the filePath
          const fileId = await uploadFile(filePath);
          console.log(`File uploaded successfully with ID: ${fileId}`);
          rl.close();
        });
        break;

      default:
        console.log('Invalid option! Please enter "upload" or "download".');
        await getUserInput(); // Recurse for valid input
    }
  });
}

// Start the input process
getUserInput();
