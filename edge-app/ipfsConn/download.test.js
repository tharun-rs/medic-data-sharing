import { downloadFile } from './FileManager.js';

const fileId = '121848'; 
const savePath = '.';

downloadFile(fileId, savePath)
    .then(() => {
        console.log('File downloaded and saved successfully!');
    })
    .catch((err) => {
        console.error('Error downloading file:', err);
    });