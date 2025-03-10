const { connectToNetwork } = require('./connect');

async function createPHIAccessRequestWithFileID(file_id, data_custodian, requestor, requestor_address){
    try {
        const { gateway, contract } = await connectToNetwork('PHIAccessRequestContract');
        const result = await contract.submitTransaction(
            'createAccessRequestWithFileID',
            file_id,
            data_custodian,
            requestor,
            requestor_address
        );
        gateway.disconnect();
        res.send({ success: true, message: 'PHI access request created successfully.', result: result.toString() });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to create PHI access request: ${error}` });
    }
}

async function createPHIAccessRequestWithFilters(requestor, requestor_address, file_type, file_tag, begin_time, end_time){
    try {
        const { gateway, contract } = await connectToNetwork('PHIAccessRequestContract');
        const result = await contract.submitTransaction(
            'createAccessRequestWithFilters',
            requestor,
            requestor_address,
            file_type,
            file_tag,
            begin_time,
            end_time
        );
        gateway.disconnect();
        res.send({ success: true, message: 'PHI access request created successfully.', result: result.toString() });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to create PHI access request: ${error}` });
    }
}

async function queryPHIAccessRequestsByFileId(fileId, requestor, requestor_address, data_custodian){
    try {
        const { gateway, contract } = await connectToNetwork('PHIAccessRequestContract');
        const result = await contract.evaluateTransaction(
            'queryAccessRequestsByFileId',
            fileId,
            requestor,
            requestor_address,
            data_custodian
        );
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query PHI access requests: ${error}` });
    }
}

// Query Access Requests by Filters
async function queryPHIAccessRequestsByFilter(requestor, requestor_address, file_type, file_tag, begin_time, end_time){
    try {
        const { gateway, contract } = await connectToNetwork('PHIAccessRequestContract');
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
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query PHI access requests: ${error}` });
    }
}

module.exports = {
    createPHIAccessRequestWithFileID,
    createPHIAccessRequestWithFilters,
    queryPHIAccessRequestsByFileId,
    queryPHIAccessRequestsByFilter
}
