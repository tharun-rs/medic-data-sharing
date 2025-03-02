'use strict';

const { Contract } = require('fabric-contract-api');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { v4: uuidv4 } = require('uuid');

class DataUploadContract extends Contract {
    
    async InitLedger(ctx) {
        console.log('Ledger initialized');
    }

    async queryAuthorizationForPatient(ctx, patient_id, data_custodian) {
        const queryString = {
            selector: {
                patient_id: patient_id,
                data_custodian: data_custodian
            }
        };
        const results = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return results.length > 0 && results[0].write_access !== false ? results : [];
    }

    async uploadPIIRecord(ctx, patient_id, data_custodian, custodian_address, internal_file_id, data_hash, time_stamp) {
        const auth = await this.queryAuthorizationForPatient(ctx, patient_id, data_custodian);
        if (auth.length === 0) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const piiRecord = {
            __id__: uuidv4(),
            auth_id: auth[0].__id__,
            file_type: "PII",
            data_custodian,
            custodian_address,
            internal_file_id,
            data_hash,
            time_stamp
        };
        await ctx.stub.putState(piiRecord.__id__, Buffer.from(stringify(sortKeysRecursive(piiRecord))));
        return piiRecord.__id__;
    }

    async uploadPHIRecord(ctx, patient_id, data_custodian, custodian_address, internal_file_id, file_type, file_tag, data_hash, time_stamp) {
        const auth = await this.queryAuthorizationForPatient(ctx, patient_id, data_custodian);
        if (auth.length === 0) {
            throw new Error(`Authorization denied for data custodian: ${data_custodian}`);
        }

        const phiRecord = {
            __id__: uuidv4(),
            auth_id: auth[0].__id__,
            file_type: "PHI",
            data_custodian,
            custodian_address,
            internal_file_id,
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
