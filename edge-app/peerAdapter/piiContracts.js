const { connectToNetwork } = require('./connect');

async function createPIIAccessRequestWithFileID(file_id, data_custodian, requestor, requestor_address){
    try {
        const { gateway, contract } = await connectToNetwork('PIIAccessContract');
        const result = await contract.submitTransaction(
            'createAccessRequestWithFileID',
            file_id,
            data_custodian,
            requestor,
            requestor_address
        );
        gateway.disconnect();
        res.send({ success: true, message: 'PII access request created successfully.', result: result.toString() });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to create PII access request: ${error}` });
    }
}

async function queryPIIAccessRequestsByFileID(fileId){
    try {
        const { gateway, contract } = await connectToNetwork('PIIAccessContract');
        const result = await contract.evaluateTransaction('queryAccessRequestsByFileID', fileId);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query PII access requests: ${error}` });
    }
}

module.exports = {
    createPIIAccessRequestWithFileID,
    queryPIIAccessRequestsByFileID
}