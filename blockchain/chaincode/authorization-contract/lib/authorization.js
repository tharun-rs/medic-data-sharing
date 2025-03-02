'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const Authorization = require('./authorization');
const { v4: uuidv4 } = require('uuid');

class Authorization extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                _id: uuidv4(),
                file_id: 'asset1',
                file_type: 'AUTH',
                data_custodian: 'Org1',
                custodian_address: 'libp2p_address_1',
                internal_file_id: 1,
                patient_id: 1001,
                data_hash: 'hash1',
                time_stamp: new Date().toISOString(),
                anonymous_phi_access: false
            },
            {
                _id: uuidv4(),
                file_id: 'asset2',
                file_type: 'AUTH',
                data_custodian: 'Org2',
                custodian_address: 'libp2p_address_2',
                internal_file_id: 2,
                patient_id: 1002,
                data_hash: 'hash2',
                time_stamp: new Date().toISOString(),
                anonymous_phi_access: true
            }
        ];

        for (const asset of assets) {
            await ctx.stub.putState(asset._id, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    async uploadNewAuthorization(ctx, file_id, data_custodian, custodian_address, internal_file_id, patient_id, data_hash, time_stamp, anonymous_phi_access) {
        const authRecord = {
            _id: uuidv4(),
            file_id: file_id,
            file_type: 'AUTH',
            data_custodian,
            custodian_address,
            internal_file_id,
            patient_id,
            data_hash,
            time_stamp,
            anonymous_phi_access
        };

        await ctx.stub.putState(file_id, Buffer.from(stringify(sortKeysRecursive(authRecord))));
        return file_id;
    }

    async queryAuthorizationsForPatient(ctx, patient_id, custodian) {
        const queryString = {
            selector: { file_type: 'AUTH', patient_id, data_custodian: custodian }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryAuthorizationsForAnonymousData(ctx, custodian) {
        const queryString = {
            selector: { file_type: 'AUTH', data_custodian: custodian, anonymous_phi_access: true }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async QueryWithQueryString(ctx, queryString) {
        const iterator = await ctx.stub.getQueryResult(queryString);
        const results = [];
        let result = await iterator.next();
        while (!result.done) {
            const strValue = result.value.value.toString('utf8');
            results.push(JSON.parse(strValue));
            result = await iterator.next();
        }
        return JSON.stringify(results);
    }
}

module.exports = Authorization;
