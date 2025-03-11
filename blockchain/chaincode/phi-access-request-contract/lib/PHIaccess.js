'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');

class PHIAccessRequestContract extends Contract {
    async createAccessRequestWithFileID(ctx, patient_id, file_id, data_custodian, requestor, requestor_address, time_stamp) {
        const auth = await ctx.stub.invokeChaincode(
            'auth', // Target contract name
            ['queryAuthorizationForPatient', patient_id, requestor], // Function name and arguments
            ctx.stub.getChannelID()
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke AccessControlContract: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record.read_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const request = {
            data_custodian,
            requestor,
            requestor_address,
            file_id,
            time_stamp
        };
        const compositeKey = ctx.stub.createCompositeKey('PHIAccess', [file_id, requestor]);
        await ctx.stub.putState(compositeKey, Buffer.from(stringify(sortKeysRecursive(request))));
        return JSON.stringify(request);
    }

    async createAccessRequestWithFilters(ctx, requestor, requestor_address, file_type, file_tag, begin_time, end_time, time_stamp) {
        const auth = await ctx.stub.invokeChaincode(
            'auth', // Target contract name
            ['queryAuthorizationForAnonymousData', requestor], // Function name and arguments
            ctx.stub.getChannelID()
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke AccessControlContract: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record==Record.read_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const request = {
            requestor,
            requestor_address,
            file_type,
            file_tag,
            begin_time,
            end_time,
            time_stamp
        };
        
        const compositeKey = ctx.stub.createCompositeKey('PHIAccess', [file_id, requestor]);
        await ctx.stub.putState(compositeKey, Buffer.from(stringify(sortKeysRecursive(request))));
        return JSON.stringify(request);
    }

    async queryAccessRequestsByFileId(ctx, file_id, requestor, requestor_address, data_custodian) {
        const queryString = {
            selector: {
                file_id: file_id,
                requestor: requestor,
                requestor_address: requestor_address,
                data_custodian: data_custodian
            }
        };
        return await this.queryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryAccessRequestsByFilter(ctx, requestor, requestor_address, file_type, file_tag, begin_time, end_time) {
        const queryString = {
            selector: {
                requestor: requestor,
                requestor_address: requestor_address,
                file_type: file_type,
                file_tag: file_tag,
                begin_time: { "$gte": begin_time },
                end_time: { "$lte": end_time }
            }
        };
        return await this.queryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryWithQueryString(ctx, queryString) {
        const results = [];
        const iterator = await ctx.stub.getQueryResult(queryString);
        
        try {
            while (true) {
                const res = await iterator.next();
                if (res.done) break;
                results.push(JSON.parse(res.value.value.toString('utf8')));
            }
        } finally {
            await iterator.close();
        }
        
        return results;
    }
}

module.exports = PHIAccessRequestContract;
