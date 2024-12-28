import express from 'express';
import bodyParser from 'body-parser';
import IPFSNode from './ipfsNode.js';

const app = express();
const port = process.env.PORT || 3001;

// Initialize the IPFS Node
const ipfsNode = new IPFSNode();
await ipfsNode.initialize();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Endpoint to upload file to IPFS
app.post('/upload', async (req, res) => {
    try {
        const { fileData } = req.body; // base64 encoded
        const decodedData = Buffer.from(fileData, 'base64');
        const cid = await ipfsNode.uploadBytes(new Uint8Array(decodedData));
        res.json({ cid });
    } catch (error) {
        res.status(500).send('Error uploading file');
    }
});

// Endpoint to download file from IPFS
app.get('/download/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        console.log(cid);
        
        // Get the file data as Uint8Array
        const fileData = await ipfsNode.downloadBytes(cid);
        console.log(fileData);

        // Convert the Uint8Array to a Base64 string
        const base64Data = Buffer.from(fileData).toString('base64');
        
        // Return the Base64 encoded string as the response
        res.send({ base64Data });
    } catch (error) {
        res.status(500).send('Error downloading file');
    }
});



// Start the server
app.listen(port, () => {
    console.log(`IPFS Node server listening at http://localhost:${port}`);
});
