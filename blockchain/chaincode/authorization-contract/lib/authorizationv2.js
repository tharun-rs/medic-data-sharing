'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class Authorizationv2 extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                ID: 'asset1',
                Color: 'blue',
                Size: 5,
                Owner: 'Tomoko',
                AppraisedValue: 300,
            },
            {
                ID: 'asset2',
                Color: 'red',
                Size: 5,
                Owner: 'Brad',
                AppraisedValue: 400,
            }
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            docType: 'asset',
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    async GetAllAssets(ctx) {
        const queryString = { selector: { docType: 'asset' } };
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

    async uploadNewAuthorization(ctx, file_id, patient_id, data_custodian, custodian_address, read_access, write_access, anonymous_phi_access) {
        const authRecord = {
            docType: 'authorization',
            file_id,
            patient_id,
            data_custodian,
            custodian_address,
            read_access,
            write_access,
            anonymous_phi_access
        };

        await ctx.stub.putState(file_id, Buffer.from(stringify(sortKeysRecursive(authRecord))));
        return file_id;
    }

    async queryAuthorizationsForPatient(ctx, patient_id, custodian) {
        const queryString = {
            selector: { docType: 'authorization', patient_id, data_custodian: custodian }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }

    async queryAuthorizationsForAnonymousData(ctx, custodian) {
        const queryString = {
            selector: { docType: 'authorization', data_custodian: custodian, anonymous_phi_access: true }
        };
        return await this.QueryWithQueryString(ctx, JSON.stringify(queryString));
    }
}

module.exports = Authorizationv2;
