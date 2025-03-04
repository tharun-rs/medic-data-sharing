'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { v4: uuidv4 } = require('uuid');

class DataUploadContract extends Contract {

    async uploadPIIRecord(ctx, patient_id, data_custodian, custodian_address, data_hash, time_stamp) {
        const auth = await ctx.stub.invokeChaincode(
            'AuthorizationContract', // Target contract name
            ['queryAuthorizationForPatient', patient_id, data_custodian], // Function name and arguments
            ctx.stub.getChannelID() // Channel name (optional)
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke AccessControlContract: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record.Record.write_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const piiRecord = {
            __id__: uuidv4(),
            patient_id,
            file_id,
            file_type: "PII",
            data_custodian,
            custodian_address,
            data_hash,
            time_stamp
        };
        await ctx.stub.putState(piiRecord.__id__, Buffer.from(stringify(sortKeysRecursive(piiRecord))));
        return piiRecord.__id__;
    }

    async uploadPHIRecord(ctx, patient_id, data_custodian, custodian_address, file_type, file_tag, data_hash, time_stamp) {
        const auth = await ctx.stub.invokeChaincode(
            'AuthorizationContract', // Target contract name
            ['queryAuthorizationForPatient', patient_id, data_custodian], // Function name and arguments
            ctx.stub.getChannelID()
        );

        if (auth.status !== 200) {
            throw new Error(`Failed to invoke AccessControlContract: ${auth.message}`);
        }

        // Convert payload to JSON
        const authPayload = JSON.parse(auth.payload.toString());

        // Check if the response is empty or if write_access is false in any entry
        if (!authPayload.length || authPayload.some(record => !record.Record.write_access)) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const phiRecord = {
            __id__: uuidv4(),
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
        await ctx.stub.putState(phiRecord.__id__, Buffer.from(stringify(sortKeysRecursive(phiRecord))));
        return phiRecord.__id__;
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