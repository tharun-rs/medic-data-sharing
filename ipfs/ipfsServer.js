import express from 'express';
import bodyParser from 'body-parser';
import IPFSNode from './ipfsNode';

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
        const { fileData } = req.body; // Assuming the file is sent as base64 or binary data
        const cid = await ipfsNode.uploadBytes(new Uint8Array(fileData));
        res.json({ cid });
    } catch (error) {
        res.status(500).send('Error uploading file');
    }
});

// Endpoint to download file from IPFS
app.get('/download/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const fileData = await ipfsNode.downloadBytes(cid);
        res.send(fileData);
    } catch (error) {
        res.status(500).send('Error downloading file');
    }
});


// Start the server
app.listen(port, () => {
    console.log(`IPFS Node server listening at http://localhost:${port}`);
});
