'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');

class PIIAccessContract extends Contract {

    async createAccessRequestWithFileID(ctx, file_id, data_custodian, requestor, requestor_address, time_stamp) {

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

        const piiRequest = {
            data_custodian,
            requestor,
            requestor_address,
            file_id,
            time_stamp
        };

        const compositeKey = ctx.stub.createCompositeKey('PIIAccess', [file_id, requestor]);
        await ctx.stub.putState(compositeKey, Buffer.from(stringify(sortKeysRecursive(piiRequest))));
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
