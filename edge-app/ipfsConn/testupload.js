import { uploadFile } from './FileManager.js';

const filePath = './sum.txt'; 

uploadFile(filePath)
  .then((fileId) => {
    console.log(`File uploaded successfully! File ID: ${fileId}`); 
  })
  .catch((err) => {
    console.error('Error uploading file:', err);
  });
