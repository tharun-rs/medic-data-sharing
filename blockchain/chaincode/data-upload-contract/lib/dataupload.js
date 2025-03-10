'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');

class DataUploadContract extends Contract {

    async uploadPIIRecord(ctx, patient_id, file_id, data_custodian, custodian_address, data_hash, time_stamp) {
        const auth = await ctx.stub.invokeChaincode(
            'auth', // Target contract name
            ['queryAuthorizationForPatient', patient_id, data_custodian], // Function name and arguments
            ctx.stub.getChannelID() // Channel name (optional)
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke auth: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record.write_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const piiRecord = {
            patient_id,
            file_id,
            file_type: "PII",
            data_custodian,
            custodian_address,
            data_hash,
            time_stamp
        };
        const compositeKey = ctx.stub.createCompositeKey('PIIRecord', [file_id, data_custodian]);
        await ctx.stub.putState(compositeKey, Buffer.from(stringify(sortKeysRecursive(piiRecord))));
        return compositeKey;
    }

    async uploadPHIRecord(ctx, patient_id, file_id, data_custodian, custodian_address, file_type, file_tag, data_hash, time_stamp) {
        const auth = await ctx.stub.invokeChaincode(
            'auth',
            ['queryAuthorizationForPatient', patient_id, data_custodian],
            ctx.stub.getChannelID()
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke auth: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record.write_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const phiRecord = {
            patient_id,
            file_id,
            file_type: "PHI",
            data_custodian,
            custodian_address,
            file_type,
            file_tag,
            data_hash,
            time_stamp
        };
        const compositeKey = ctx.stub.createCompositeKey('PHIRecord', [file_id, data_custodian]);
        await ctx.stub.putState(compositeKey, Buffer.from(stringify(sortKeysRecursive(phiRecord))));
        return compositeKey;
    }

    async getAllPIIByPatientID(ctx, patient_id) {
        const queryString = {
            selector: {
                file_type: "PII",
                patient_id: patient_id
            }
        };
        return await this.queryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async getAllPHIByPatientID(ctx, patient_id) {
        const queryString = {
            selector: {
                file_type: "PHI",
                patient_id: patient_id
            }
        };
        return await this.queryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async getAllPHIByFilters(ctx, file_type, file_tag, start_time, end_time) {
        const queryString = {
            selector: {
                file_type: "PHI",
                file_type: file_type,
                file_tag: file_tag,
                time_stamp: { "$gte": start_time, "$lte": end_time }
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

                const jsonString = res.value.value.toString('utf8');
                try {
                    results.push(JSON.parse(jsonString));
                } catch (err) {
                    console.error(`Error parsing JSON: ${jsonString}`, err);
                }
            }
        } finally {
            await iterator.close(); // Ensure iterator is closed to free resources
        }

        return results;
    }

}

module.exports = DataUploadContract;