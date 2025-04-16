import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Ensure the directory exists before writing the file.
 * @param {string} filePath - Full path of the file to be saved.
 */
function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Function to request and download a file from the server.
 * @param {string} endpoint - API endpoint (e.g., "authorization/patientId" or "pii").
 * @param {Object} requestData - The request body to send in the POST request.
 * @param {string} savePath - The path to save the downloaded file.
 * @param {number} port - The server port.
 */
async function downloadFile(endpoint, requestData, savePath, port) {
    const apiUrl = `http://localhost:${port}/fileHandler/${endpoint}`;

    try {
        ensureDirectoryExists(savePath); // Ensure the directory exists

        const response = await axios.post(apiUrl, requestData, {
            responseType: "stream",
        });

        const writer = fs.createWriteStream(savePath);
        response.data.pipe(writer);

        writer.on("finish", () => {
            console.log(`File downloaded successfully: ${savePath}`);
        });

        writer.on("error", (err) => {
            console.error("Error writing file:", err);
        });

    } catch (error) {
        console.error(`Error downloading from ${endpoint}:`, error.message);
    }
}

/**
 * Function to download an authorization file.
 */
export async function downloadAuthorizationFile(patientId, requestor, savePath, port) {
    const requestData = { patientId, requestor };
    await downloadFile("/download/authorization/patientId", requestData, savePath, port);
}

/**
 * Function to download a PII file.
 */
export async function downloadPIIFile(patientId, savePath, port) {
    const requestData = { patientId };
    await downloadFile("download/pii", requestData, savePath, port);
}

export async function downloadFromIPFS(cid, port, filePath) {
    const apiUrl = `http://localhost:${port}/download/${cid}`;
    try {
        const response = await axios.get(apiUrl);
        const { base64Data } = response.data;

        // Decode the Base64 string back to a Buffer
        const fileBuffer = Buffer.from(base64Data, 'base64');
        ensureDirectoryExists(filePath); // Ensure the directory exists
        fs.writeFileSync(filePath, fileBuffer); // Write the buffer to the specified file path
        console.log(`File saved successfully to: ${filePath}`);
    } catch (error) {
        console.error(`Error downloading from IPFS:`, error.response ? error.response.data : error.message);
        throw error;
    }
}