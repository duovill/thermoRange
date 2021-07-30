'use strict';
ngivr.angular.factory('ngivrApi', (ngivrHttp) => {

    /**
     * Ebben van a nyers http kode
     */
    return new class {

        remove(schema, id) {
            ngivr.console.group(`NGIVR.API.REMOVE ${schema}`);
            ngivr.console.log(`ID: ${id}`);
            ngivr.console.group();
            return ngivrHttp.get(`/data/${schema}/remove/${id}`);

        }

        disable(schema, id) {
            ngivr.console.group(`NGIVR.API.DISABLE/TRASH ${schema}`);
            ngivr.console.log(`ID: ${id}`);
            ngivr.console.group();
            return ngivrHttp.get(`/data/${schema}/trash/${id}`);
        }

        trash(schema, id) {
            return this.disable(schema, id)
        }

        schema(schema) {
            ngivr.console.group(`NGIVR.API.SCHEMA ${schema}`);
            ngivr.console.group();
            return ngivrHttp.get(`/data/${schema}/schema/`)
        }

        last(schema, body) {
            ngivr.console.group(`NGIVR.API.LAST ${schema}`);
            ngivr.console.group();
            return ngivrHttp({
                url: `/data/${schema}/last`,
                method: 'POST',
                data: body
            })
        }

        id(schema, id, body, manPopulate) {
            ngivr.console.group(`NGIVR.API.ID ${schema}`);
            if (schema === 'site') {
                console.warn('SITEID', id)
            }
            ngivr.console.log(`ID: ${id}`);
            ngivr.console.group();
            let populate = ngivr.settings.populate[schema];
            if (manPopulate) populate = populate.concat(manPopulate)
            if (body === undefined) {
                body = {populate: populate}
            } else {
                body.populate = populate
            }
            if (id === '5ca33e17caaf4b30a50d8c4d') {
                console.warn('BODY:', body)
            }
            return ngivrHttp({
                url: `/data/${schema}/id/${id}`,
                method: 'POST',
                data: body
            })
        }

        save(schema, model) {
            ngivr.console.group(`NGIVR.API.SAVE ${schema}`);
            ngivr.console.log(model);
            ngivr.console.group();
            return ngivrHttp({
                url: `/data/${schema}/save`,
                method: 'POST',
                data: model
            })
        }

        saveApi(schema, model) {
            ngivr.console.group(`NGIVR.API.SAVEAPI ${schema}`);
            ngivr.console.log(model);
            ngivr.console.group();
            return ngivrHttp({
                url: `/api/${schema}/save`,
                method: 'POST',
                data: model
            }).then((response) => {
                return response;
            })
        }

        query(schema, queryRequestParam, url, union, silent = false) {
            const queryRequest = Object.assign({}, queryRequestParam);
            let query = {
                aggregate: typeof(queryRequest.aggregate) === 'undefined' ? undefined : queryRequest.aggregate,
                forFilter: typeof(queryRequest.forFilter) === 'undefined' ? undefined : queryRequest.forFilter,
                ignoreOverride: typeof(queryRequest.ignoreOverride) === 'undefined' ? undefined : queryRequest.ignoreOverride,
                search: typeof(queryRequest.search) === 'undefined' ? undefined : queryRequest.search,
                sort: typeof(queryRequest.sort) === 'undefined' ? undefined : queryRequest.sort,
                limit: typeof(queryRequest.limit) === 'undefined' ? undefined : queryRequest.limit,
                page: typeof(queryRequest.page) === 'undefined' ? undefined : queryRequest.page,
                populate: typeof(queryRequest.populate) !== 'undefined' ? queryRequest.populate : typeof(ngivr.settings.populate[schema]) === 'undefined' ? undefined : ngivr.settings.populate[schema],
                restricted: typeof(queryRequest.restricted) === 'undefined' ? undefined : queryRequest.restricted,
                manualPopulate: typeof(queryRequest.manualPopulate) === 'undefined' ? undefined : queryRequest.manualPopulate,
                afterQuery: typeof(queryRequest.afterQuery) === 'undefined' ? undefined : queryRequest.afterQuery,
                settings: typeof(queryRequest.settings) === 'undefined' ? {
                    searchModeStartsWith:  ngivr.settings.defaultSearchModeStartsWith
                } : queryRequest.settings

            };
            ngivr.console.group(`NGIVR.API.QUERY ${schema}`);
            ngivr.console.log(query);
            ngivr.console.group();

            if ((typeof url === 'string' && url.trim() === '') || typeof url !== 'string') {
                url = undefined
            }

            const headers = {}

            if (silent === true) {
                headers['ngivr-request-silent'] = 1
            }

            return ngivrHttp({
                url: union === undefined ?
                    (url === undefined ? `/data/${schema}/query` : url)
                    : `/data/union/query/${union.join(',')}`,
                method: 'POST',
                data: query,
                headers: headers,
            })
        }

        insertMany(schema, insertData) {
            ngivr.console.group(`NGIVR.API.insertMany ${schema}`);
            ngivr.console.log(insertData);
            ngivr.console.group();
            return ngivrHttp({
                url: `/data/${schema}/insert-many`,
                method: 'POST',
                data: insertData
            })
        }

        updateMany(schema, updateData) {
            ngivr.console.group(`NGIVR.API.updateMany ${schema}`);
            ngivr.console.log(updateData);
            ngivr.console.group();
            return ngivrHttp({
                url: `/data/${schema}/update-many`,
                method: 'POST',
                data: updateData
            })
        }

    }
});

