const express = require('express');
const cors = require("cors");

// Routes
const fileUploadRouter = require('./routes/fileRoutes/uploadRoutes');


const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Built-in JSON parser
app.use(express.urlencoded({ extended: true })); // For URL-encoded data

app.use("/fileHandler/upload", fileUploadRouter);

// Start the server
app.listen(port, () => {
    console.log(`Edge Node Server is listening on port ${port}`);
});
