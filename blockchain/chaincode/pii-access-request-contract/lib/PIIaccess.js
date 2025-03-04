const { Contract } = require('fabric-contract-api');
const { v4: uuidv4 } = require('uuid');

class PIIAccessContract extends Contract {

    async createAccessRequestWithFileID(ctx, file_id, data_custodian, requestor, requestor_address) {

        const auth = await ctx.stub.invokeChaincode(
            'AuthorizationContract', // Target contract name
            ['queryAuthorizationForPatient', patient_id, requestor], // Function name and arguments
            ctx.stub.getChannelID()
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke AccessControlContract: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record.Record.read_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const requestID = uuidv4();
        const timeStamp = new Date().toISOString();

        const piiRequest = {
            __id__: requestID,
            auth_id: authResponse[0].__id__,
            data_custodian: data_custodian,
            requestor: requestor,
            requestor_address: requestor_address,
            file_id: file_id,
            time_stamp: timeStamp
        };

        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(piiRequest)));
        return JSON.stringify(piiRequest);
    }

    async queryAccessRequestsByFileID(ctx, file_id) {
        const queryString = {
            selector: {
                file_id: file_id
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = [];
        let result = await iterator.next();

        while (!result.done) {
            results.push(JSON.parse(result.value.value.toString('utf8')));
            result = await iterator.next();
        }

        return JSON.stringify(results);
    }
}

module.exports = PIIAccessContract;
