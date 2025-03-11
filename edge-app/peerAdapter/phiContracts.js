const { connectToNetwork } = require('./connect');

async function createPHIAccessRequestWithFileID(patient_id, file_id, data_custodian, requestor, requestor_address){
    try {
        const { gateway, contract } = await connectToNetwork('phi');
        const result = await contract.submitTransaction(
            'createAccessRequestWithFileID',
            patient_id,
            file_id,
            data_custodian,
            requestor,
            requestor_address,
            new Date().toISOString(),
        );
        gateway.disconnect();
        return result.toString();
    } catch (error) {
        throw error;
    }
}

async function createPHIAccessRequestWithFilters(requestor, requestor_address, file_type, file_tag, begin_time, end_time){
    try {
        const { gateway, contract } = await connectToNetwork('phi');
        const result = await contract.submitTransaction(
            'createAccessRequestWithFilters',
            requestor,
            requestor_address,
            file_type,
            file_tag,
            begin_time,
            end_time,
            new Date().toISOString(),
            
        );
        gateway.disconnect();return result.toString();
    } catch (error) {
        throw error;
    }
}

async function queryPHIAccessRequestsByFileId(fileId, requestor, requestor_address, data_custodian){
    try {
        const { gateway, contract } = await connectToNetwork('phi');
        const result = await contract.evaluateTransaction(
            'queryAccessRequestsByFileId',
            fileId,
            requestor,
            requestor_address,
            data_custodian
        );
        gateway.disconnect();
        return JSON.parse(result.toString());
    } catch (error) {
        throw error;
    }
}

// Query Access Requests by Filters
async function queryPHIAccessRequestsByFilter(requestor, requestor_address, file_type, file_tag, begin_time, end_time){
    try {
        const { gateway, contract } = await connectToNetwork('phi');
        const result = await contract.evaluateTransaction(
            'queryAccessRequestsByFilter',
            requestor,
            requestor_address,
            file_type,
            file_tag,
            begin_time,
            end_time
        );
        gateway.disconnect();
        return JSON.parse(result.toString());
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createPHIAccessRequestWithFileID,
    createPHIAccessRequestWithFilters,
    queryPHIAccessRequestsByFileId,
    queryPHIAccessRequestsByFilter
}
