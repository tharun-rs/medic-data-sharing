'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const { v4: uuidv4 } = require('uuid');

class AuthorizationContract extends Contract {

    async InitLedger(ctx) { // only for testing purposes
        const authorizations = [
            {
                __id__: uuidv4(),
                file_id: 'fileid1',
                data_custodian: 'Org1',
                custodian_address: '/ip4/192.168.1.100/tcp/4001/p2p/QmXkYb3sUq8g1d9y7iF4kRzFJnP7zNwJrXxFgF3GJwGk9T',
                patient_id: 1234567890123456,
                data_hash: 'c0535e4be2b79ffd93291305436bf889314e4a3faec05ecffcbb9ace6f3b34e6',
                time_stamp: new Date().toISOString(),
                anonymous_phi_access: false,
                write_access: false,
                read_access: true
            },
            {
                __id__: uuidv4(),
                file_id: 'asset2',
                data_custodian: 'Org2',
                custodian_address: '/ip4/192.168.1.101/tcp/4001/p2p/QmXkYb3F4kRzFJnP7zNwJrXgF3GJwGk9TxsUq8g1d9y7iF',
                patient_id: 9876543210987654,
                data_hash: '7f9c2ba4e88f827d616045507605653e6f597d382a1236e99d0d0884ac5f5a79',
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

    async uploadNewAuthorization(ctx, file_id, patient_id, data_hash, data_custodian, custodian_address, read_access, write_access, anonymous_phi_access) {
        const authRecord = {
            __id__: uuidv4(),
            file_id,
            data_custodian,
            custodian_address,
            patient_id,
            data_hash,
            time_stamp: new Date().toISOString(),
            anonymous_phi_access,
            write_access,
            read_access
        };

        await ctx.stub.putState(authRecord.__id__, Buffer.from(stringify(sortKeysRecursive(authRecord))));
        return authRecord.__id__;
    }

    async queryAuthorizationForPatient(ctx, patient_id, requestor) {
        const queryString = {
            selector: { patient_id, data_custodian: requestor }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryAuthorizationForPatientByFileId(ctx, file_id, requestor) {
        const queryString = {
            selector: { file_id, data_custodian: requestor }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryAuthorizationForAnonymousData(ctx, requestor) {
        const queryString = {
            selector: { data_custodian: requestor, anonymous_phi_access: true }
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

module.exports = AuthorizationContract;
