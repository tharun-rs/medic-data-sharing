const { Contract } = require('fabric-contract-api');
const { v4: uuidv4 } = require('uuid');

class PIIAccessContract extends Contract {
    async createAccessRequestWithFileID(ctx, file_id, patient_id, data_custodian, requestor, requestor_address) {
        // Query authorization
        const authResponse = await this.queryAuthorizationsForPatient(ctx, patient_id, data_custodian);
        if (!authResponse || authResponse.length === 0 || authResponse[0].read_access === false) {
            throw new Error(`Access denied for requestor ${requestor}`);
        }

        const requestID = uuidv4();
        const timeStamp = new Date().toISOString();

        const piiRequest = {
            __id__: requestID,
            auth_id: authResponse[0].__id__,
            file_id: file_id,
            data_custodian: data_custodian,
            requestor: requestor,
            requestor_address: requestor_address,
            internal_file_id: parseInt(file_id, 10),
            time_stamp: timeStamp
        };

        await ctx.stub.putState(requestID, Buffer.from(JSON.stringify(piiRequest)));
        return JSON.stringify(piiRequest);
    }

    async queryAccessRequestsByFileID(ctx, file_id, data_custodian, requestor, requestor_address) {
        const queryString = {
            selector: {
                file_id: file_id,
                data_custodian: data_custodian,
                requestor: requestor,
                requestor_address: requestor_address
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

    async queryAuthorizationsForPatient(ctx, patient_id, custodian) {
        const queryString = {
            selector: {
                patient_id: patient_id,
                data_custodian: custodian
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = [];
        let result = await iterator.next();

        while (!result.done) {
            results.push(JSON.parse(result.value.value.toString('utf8')));
            result = await iterator.next();
        }

        return results;
    }
}

module.exports = PIIAccessContract;
