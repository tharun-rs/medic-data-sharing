const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.post('/send-string', async (req, res) => {
    try {
        const stringData = req.body.stringData; // Expecting the string to be sent

        // Encode the string as a Uint8Array
        const byteArray = new TextEncoder().encode(stringData);

        // Convert the Uint8Array to a Base64 string
        const base64Data = Buffer.from(byteArray).toString('base64');

        const response = await axios.post(`${process.env.IPFS_API_URI}/upload`, {
            fileData: base64Data
        });

        const cid = response.data.cid; // Extract CID
        res.json({ cid });

        console.log(`String uploaded with CID: ${cid}`);
    } catch (error) {
        res.status(500).send(`Error uploading string: ${error}`);
    }
});

// Sample endpoint to download string from IPFS using the CID
app.get('/retrieve-string/:cid', async (req, res) => {
    try {
        const { cid } = req.params;

        // Fetch the Base64-encoded file data from the IPFS node
        const response = await axios.get(`${process.env.IPFS_API_URI}/download/${cid}`);
        
        // Assuming the response data is a JSON object with the base64-encoded file data
        const base64Data = response.data.base64Data;

        // Decode the Base64 string to binary data (Uint8Array)
        const decodedData = Buffer.from(base64Data, 'base64');

        // Convert the Uint8Array back to a string (assuming the data is UTF-8 encoded text)
        const data = new TextDecoder().decode(new Uint8Array(decodedData));

        console.log(`String retrieved from IPFS: ${data}`);

        // Send the decoded string as the response
        res.send(data);
    } catch (error) {
        res.status(500).send(`Error retrieving string: ${error}`);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Edge Node Server is listening on port ${port}`);
});
