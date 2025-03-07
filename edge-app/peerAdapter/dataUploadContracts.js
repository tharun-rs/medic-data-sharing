const { connectToNetwork } = require('./connect');

async function uploadPIIRecord (patient_id, data_custodian, custodian_address, data_hash, time_stamp){
    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.submitTransaction(
            'uploadPIIRecord',
            patient_id,
            data_custodian,
            custodian_address,
            data_hash,
            time_stamp
        );
        gateway.disconnect();
        res.send({ success: true, message: 'PII record uploaded successfully.', result: result.toString() });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to upload PII record: ${error}` });
    }
}

async function uploadPHIRecord(patient_id, data_custodian, custodian_address, file_type, file_tag, data_hash, time_stamp){
    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.submitTransaction(
            'uploadPHIRecord',
            patient_id,
            data_custodian,
            custodian_address,
            file_type,
            file_tag,
            data_hash,
            time_stamp
        );
        gateway.disconnect();
        res.send({ success: true, message: 'PHI record uploaded successfully.', result: result.toString() });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to upload PHI record: ${error}` });
    }
}

async function getAllPIIByPatientID(patientId) {
    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.evaluateTransaction('getAllPIIByPatientID', patientId);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to retrieve PII records: ${error}` });
    }
}

async function getAllPHIByPatientID(patientId){
    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.evaluateTransaction('getAllPHIByPatientID', patientId);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to retrieve PHI records: ${error}` });
    }
}

async function getAllPHIByFilters(file_type, file_tag, start_time, end_time){
    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.evaluateTransaction('getAllPHIByFilters', file_type, file_tag, start_time, end_time);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to retrieve PHI records: ${error}` });
    }
}

module.exports = {
    uploadPIIRecord,
    uploadPHIRecord,
    getAllPIIByPatientID,
    getAllPHIByPatientID,
    getAllPHIByFilters
}
