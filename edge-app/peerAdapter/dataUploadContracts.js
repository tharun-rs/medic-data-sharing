const connectToNetwork = require('./connect');

async function uploadPIIRecord (patient_id, file_id, data_custodian, custodian_address, data_hash){
    try {
        const { gateway, contract } = await connectToNetwork('data');
        const result = await contract.submitTransaction(
            'uploadPIIRecord',
            patient_id,
            file_id,
            data_custodian,
            custodian_address,
            data_hash,
            new Date().toISOString()
        );
        gateway.disconnect();
        return result.toString();
    } catch (error) {
        throw error;
    }
}

async function uploadPHIRecord(patient_id, file_id, data_custodian, custodian_address, file_type, file_tag, data_hash){
    try {
        const { gateway, contract } = await connectToNetwork('data');
        const result = await contract.submitTransaction(
            'uploadPHIRecord',
            patient_id,
            file_id,
            data_custodian,
            custodian_address,
            file_type,
            file_tag,
            data_hash,
            new Date().toISOString()
        );
        gateway.disconnect();
        return result.toString();
    } catch (error) {
        throw error;
    }
}

async function getAllPIIByPatientID(patientId) {
    try {
        const { gateway, contract } = await connectToNetwork('data');
        const result = await contract.evaluateTransaction('getAllPIIByPatientID', patientId);
        gateway.disconnect();
        return JSON.parse(result.toString());
    } catch (error) {
        throw error;
    }
}

async function getAllPHIByPatientID(patientId){
    try {
        const { gateway, contract } = await connectToNetwork('data');
        const result = await contract.evaluateTransaction('getAllPHIByPatientID', patientId);
        gateway.disconnect();
        return JSON.parse(result.toString());
    } catch (error) {
        throw error;
    }
}

async function getAllPHIByFilters(file_type, file_tag, start_time, end_time){
    try {
        const { gateway, contract } = await connectToNetwork('data');
        const result = await contract.evaluateTransaction('getAllPHIByFilters', file_type, file_tag, start_time, end_time);
        gateway.disconnect();
        return JSON.parse(result.toString());
    } catch (error) {
        throw error;
    }
}

module.exports = {
    uploadPIIRecord,
    uploadPHIRecord,
    getAllPIIByPatientID,
    getAllPHIByPatientID,
    getAllPHIByFilters
}
