

// ==============================================
// Routes for Authorization Contract
// ==============================================

// Upload New Authorization
app.post('/uploadAuthorization', async (req, res) => {
    const { file_id, patient_id, data_hash, data_custodian, custodian_address, read_access, write_access, anonymous_phi_access } = req.body;

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
});

// Query Authorization for Patient
app.get('/queryAuthorizationForPatient/:patientId/:requestor', async (req, res) => {
    const { patientId, requestor } = req.params;

    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.evaluateTransaction('queryAuthorizationForPatient', patientId, requestor);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query authorization: ${error}` });
    }
});

// Query Authorization for Patient by File ID
app.get('/queryAuthorizationForPatientByFileId/:fileId/:requestor', async (req, res) => {
    const { fileId, requestor } = req.params;

    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.evaluateTransaction('queryAuthorizationForPatientByFileId', fileId, requestor);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query authorization: ${error}` });
    }
});

// Query Authorization for Anonymous Data
app.get('/queryAuthorizationForAnonymousData/:requestor', async (req, res) => {
    const { requestor } = req.params;

    try {
        const { gateway, contract } = await connectToNetwork('AuthorizationContract');
        const result = await contract.evaluateTransaction('queryAuthorizationForAnonymousData', requestor);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query anonymous authorizations: ${error}` });
    }
});

// ==============================================
// Routes for Upload Contract
// ==============================================

// Upload PII Record
app.post('/uploadPIIRecord', async (req, res) => {
    const { patient_id, data_custodian, custodian_address, data_hash, time_stamp } = req.body;

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
});

// Upload PHI Record
app.post('/uploadPHIRecord', async (req, res) => {
    const { patient_id, data_custodian, custodian_address, file_type, file_tag, data_hash, time_stamp } = req.body;

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
});

// Get All PII Records by Patient ID
app.get('/getAllPIIByPatientID/:patientId', async (req, res) => {
    const { patientId } = req.params;

    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.evaluateTransaction('getAllPIIByPatientID', patientId);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to retrieve PII records: ${error}` });
    }
});

// Get All PHI Records by Patient ID
app.get('/getAllPHIByPatientID/:patientId', async (req, res) => {
    const { patientId } = req.params;

    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.evaluateTransaction('getAllPHIByPatientID', patientId);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to retrieve PHI records: ${error}` });
    }
});

// Get All PHI Records by Filters
app.get('/getAllPHIByFilters', async (req, res) => {
    const { file_type, file_tag, start_time, end_time } = req.query;

    try {
        const { gateway, contract } = await connectToNetwork('DataUploadContract');
        const result = await contract.evaluateTransaction('getAllPHIByFilters', file_type, file_tag, start_time, end_time);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to retrieve PHI records: ${error}` });
    }
});

// ==============================================
// Routes for PHI Access Request Contract
// ==============================================

// Create Access Request with File ID
app.post('/createPHIAccessRequestWithFileID', async (req, res) => {
    const { file_id, data_custodian, requestor, requestor_address } = req.body;

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
});

// Create Access Request with Filters
app.post('/createPHIAccessRequestWithFilters', async (req, res) => {
    const { requestor, requestor_address, file_type, file_tag, begin_time, end_time } = req.body;

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
});

// Query Access Requests by File ID
app.get('/queryPHIAccessRequestsByFileId/:fileId/:requestor/:requestor_address/:data_custodian', async (req, res) => {
    const { fileId, requestor, requestor_address, data_custodian } = req.params;

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
});

// Query Access Requests by Filters
app.get('/queryPHIAccessRequestsByFilter', async (req, res) => {
    const { requestor, requestor_address, file_type, file_tag, begin_time, end_time } = req.query;

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
});

// ==============================================
// Routes for PII Access Contract
// ==============================================

// Create Access Request with File ID
app.post('/createPIIAccessRequestWithFileID', async (req, res) => {
    const { file_id, data_custodian, requestor, requestor_address } = req.body;

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
});

// Query Access Requests by File ID
app.get('/queryPIIAccessRequestsByFileID/:fileId', async (req, res) => {
    const { fileId } = req.params;

    try {
        const { gateway, contract } = await connectToNetwork('PIIAccessContract');
        const result = await contract.evaluateTransaction('queryAccessRequestsByFileID', fileId);
        gateway.disconnect();
        res.send({ success: true, data: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).send({ success: false, message: `Failed to query PII access requests: ${error}` });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Gateway portal listening at http://localhost:${port}`);
});