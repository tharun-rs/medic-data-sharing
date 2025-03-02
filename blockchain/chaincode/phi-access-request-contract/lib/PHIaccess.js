const { Contract } = require('fabric-contract-api');
const { v4: uuidv4 } = require('uuid');

class PHIAccessRequestContract extends Contract {
    async createAccessRequestWithFileID(ctx, file_id, data_custodian, requestor, requestor_address) {
        const patient_id = await this.getPatientIDFromFile(ctx, file_id);
        const auth = await this.queryAuthorizationForPatient(ctx, patient_id, requestor);

        if (!auth || !auth.read_access) {
            throw new Error('Access denied: requestor does not have read access to this PHI.');
        }

        const request = {
            __id__: uuidv4(),
            auth_id: auth.__id__,
            file_id: file_id,
            data_custodian: data_custodian,
            requestor: requestor,
            requestor_address: requestor_address,
            internal_file_id: await this.getInternalFileID(ctx, file_id),
            time_stamp: new Date().toISOString()
        };
        await ctx.stub.putState(request.__id__, Buffer.from(JSON.stringify(request)));
        return request.__id__;
    }

    async createAccessRequestWithFilters(ctx, requestor, requestor_address, file_type, file_tag, begin_time, end_time) {
        const auth = await this.queryAuthorizationForAnonymousData(ctx, requestor);
        if (!auth || !auth.anonymous_phi_access) {
            throw new Error('Access denied: requestor does not have anonymous PHI access.');
        }

        const request = {
            __id__: uuidv4(),
            auth_id: auth.__id__,
            requestor: requestor,
            requestor_address: requestor_address,
            file_type: file_type,
            file_tag: file_tag,
            begin_time: begin_time,
            end_time: end_time,
            time_stamp: new Date().toISOString()
        };
        await ctx.stub.putState(request.__id__, Buffer.from(JSON.stringify(request)));
        return request.__id__;
    }

    async queryAccessRequestsByFileId(ctx, file_id, requestor, requestor_address, data_custodian) {
        let queryString = {
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
        let queryString = {
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
        let results = [];
        let iterator = await ctx.stub.getQueryResult(queryString);
        for await (const res of iterator) {
            if (res.value) {
                results.push(JSON.parse(res.value.toString('utf8')));
            }
        }
        return results;
    }
}

module.exports = PHIAccessRequestContract;
