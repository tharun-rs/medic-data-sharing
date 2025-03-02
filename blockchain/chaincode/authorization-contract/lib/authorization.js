'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const { v4: uuidv4 } = require('uuid');

class AuthorizationContract extends Contract {

    async InitLedger(ctx) {
        const authorizations = [
            {
                __id__: uuidv4(),
                file_id: 'asset1',
                data_custodian: 'Org1',
                custodian_address: 'libp2p_address_1',
                internal_file_id: 1,
                patient_id: 1001,
                data_hash: 'hash1',
                time_stamp: new Date().toISOString(),
                anonymous_phi_access: false,
                write_access: false,
                read_access: true
            },
            {
                __id__: uuidv4(),
                file_id: 'asset2',
                data_custodian: 'Org2',
                custodian_address: 'libp2p_address_2',
                internal_file_id: 2,
                patient_id: 1002,
                data_hash: 'hash2',
                time_stamp: new Date().toISOString(),
                anonymous_phi_access: true,
                write_access: true,
                read_access: true
            }
        ];

        for (const auth of authorizations) {
            await ctx.stub.putState(auth.__id__, Buffer.from(stringify(sortKeysRecursive(auth))));
        }
    }

    async uploadNewAuthorization(ctx, file_id, internal_file_id, patient_id, data_custodian, custodian_address, read_access, write_access, anonymous_phi_access) {
        const authRecord = {
            __id__: uuidv4(),
            file_id,
            data_custodian,
            custodian_address,
            internal_file_id,
            patient_id,
            data_hash: await this.generateHash(internal_file_id),
            time_stamp: new Date().toISOString(),
            anonymous_phi_access,
            write_access,
            read_access
        };

        await ctx.stub.putState(authRecord.__id__, Buffer.from(stringify(sortKeysRecursive(authRecord))));
        return authRecord.__id__;
    }

    async queryAuthorizationForPatient(ctx, patient_id, custodian) {
        const queryString = {
            selector: { patient_id, data_custodian: custodian }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryAuthorizationForAnonymousData(ctx, custodian) {
        const queryString = {
            selector: { data_custodian: custodian, anonymous_phi_access: true }
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

    async generateHash(internal_file_id) {
        // Simulate a hash function for demo purposes
        return `hash_${internal_file_id}`;
    }
}

module.exports = AuthorizationContract;
