const { connectToNetwork } = require('./connect');

async function uploadAuthorization (file_id, patient_id, data_hash, data_custodian, custodian_address, read_access, write_access, anonymous_phi_access) {
    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.submitTransaction(
            'uploadNewAuthorization',
            file_id,
            patient_id,
            data_hash,
            data_custodian,
            custodian_address,
            read_access,
            write_access,
            anonymous_phi_access
        );
        gateway.disconnect();
        res.send({ success: true, message: 'Authorization uploaded successfully.', result: result.toString() });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to upload authorization: ${error}` });
    }
}

async function queryAuthorizationForPatient (patientId, requestor){
    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.evaluateTransaction('queryAuthorizationForPatient', patientId, requestor);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query authorization: ${error}` });
    }
}

async function queryAuthorizationForPatientByFileId(fileId, requestor){
    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.evaluateTransaction('queryAuthorizationForPatientByFileId', fileId, requestor);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query authorization: ${error}` });
    }
}

async function queryAuthorizationForAnonymousData(requestor){
    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.evaluateTransaction('queryAuthorizationForAnonymousData', requestor);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query anonymous authorizations: ${error}` });
    }
}

module.exports = { 
    uploadAuthorization, 
    queryAuthorizationForPatient,
    queryAuthorizationForPatientByFileId,
    queryAuthorizationForAnonymousData
}