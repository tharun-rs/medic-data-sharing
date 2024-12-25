// edgeServer.js
import express from 'express';
import bodyParser from 'body-parser';
import { getUsersCollection } from './server/database/models.js';
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());




// Start the server
app.listen(port, () => {
    console.log(`Edge Node Server is listening on port ${port}`);
});
