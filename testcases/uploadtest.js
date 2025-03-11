import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// Function to upload a file to a specific endpoint
export async function uploadFile(endpoint, filePath, port, additionalData = {}) {
    const apiUrl = `http://localhost:${port}/fileHandler/${endpoint}`;
    const formData = new FormData();

    // Append file
    formData.append("file", fs.createReadStream(filePath));

    // Append additional fields based on endpoint requirements
    for (const key in additionalData) {
        formData.append(key, String(additionalData[key])); // Ensure values are strings
    }

    try {
        const response = await axios.post(apiUrl, formData, {
            headers: formData.getHeaders(), // Let Axios handle Content-Type correctly
            maxContentLength: Infinity, // Prevent Axios from rejecting large files
            maxBodyLength: Infinity
        });

        console.log(`Response from ${endpoint}:`, response.data);
    } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error.response ? error.response.data : error.message);
    }
}

export async function uploadAuthorization(filePath, port, patientId, readAccess, writeAccess, anonymousPHIAccess) {
    const additionalData = {
        patientId, readAccess, writeAccess, anonymousPHIAccess,
    };
    await uploadFile("upload/authorization", filePath, port, additionalData);
}

export async function uploadPII(filePath, port, patientId) {
    const additionalData = { patientId };
    await uploadFile("upload/pii", filePath, port, additionalData);
}

export async function uploadPHI(filePath, port, patientId, fileType, fileTag) {
    const additionalData = { patientId, fileType, fileTag };
    await uploadFile("upload/phi", filePath, port, additionalData);
}
