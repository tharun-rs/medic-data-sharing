const { Contract } = require('fabric-contract-api');
const { v4: uuidv4 } = require('uuid');
const AuthorizationContract = require('../../authorization-contract/lib/authorization');

class PIIAccessContract extends Contract {
    constructor() {
        super();
        this.authorizationContract = new AuthorizationContract();
    }

    async createAccessRequestWithFileID(ctx, file_id, data_custodian, requestor, requestor_address) {
        // Query authorization
        const authResponse = await this.authorizationContract.queryAuthorizationForPatient(ctx, requestor);
        if (!authResponse || authResponse.length === 0 || authResponse[0].read_access === false) {
            throw new Error(`Access denied for requestor ${requestor}`);
        }

        const requestID = uuidv4();
        const timeStamp = new Date().toISOString();

        const piiRequest = {
            __id__: requestID,
            auth_id: authResponse[0].__id__,
            data_custodian: data_custodian,
            requestor: requestor,
            requestor_address: requestor_address,
            internal_file_id: file_id,
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
