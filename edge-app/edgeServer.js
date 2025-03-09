const express = require('express');
const cors = require("cors");

// Routes
const fileUploadRouter = require('./routes/fileRoutes/uploadRoutes');
const fileDownloadRouter = require('./routes/fileRoutes/downloadRoutes');

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(cors()); // Enable CORS
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use("/fileHandler/upload", fileUploadRouter);
app.use("/fileHandler/download", fileDownloadRouter);

// Start the server
app.listen(port, () => {
    console.log(`Edge Node Server is listening on port ${port}`);
});
