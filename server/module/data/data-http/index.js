const mongoose = require('mongoose');
const ngivrMongoose = require('../../../../client/shared/ngivr-mongoose');
const _ = require('lodash');
const ngivrString = require('../../../../client/shared/ngivr-string');
const Mingo = require('mingo');
const utils = require('corifeus-utils');

const queryHelper = require('./query');
const mongooseUtil = require('../../util/mongoose');

/**
 * This is a general Mongoose helper interface with Express.
 */
class dataHttp {

    sendErrorResponse(options) {
        return global.ngivr.http.sendErrorResponse(options)
    }
    /**
     * Display a document/model.
     * @param response
     * @param model
     * @param id
     * @param request
     * @returns {Promise}
     */
    async id(response, model, id, request) {
        try {
            let mongooseQuery = model.findById(id);
            mongooseUtil.populate(request, mongooseQuery);
            const document = await mongooseQuery.exec();

            if (id.toString() === document._id.toString()) {
                console.warn('BODY', request.body)
                console.warn('DOCUMENT:LOADLOCATION', document.loadLocation)
                console.warn('DOCUMENT:UNLOADLOCATION', document.unloadLocation)
            }
            response.status(200).send({
                doc: document
            });
        } catch (error) {
            this.sendErrorResponse({
                response: response,
                error: error,
                result: 'not-found',
                status: 404,
            });
        }
    }


    async last(response, model, request) {
        let query = model.find();
        mongooseUtil.populate(request, query);
        const document = await query.sort({'updatedAt': -1}).limit(1);
        response.status(200).json({
            doc: document[0]
        });

    }

    queryArray(options) {
        const {
            response,
            data,
            query,
            mingoDoesntSearch,
        } = options;

        let mingoQuery;
        let search;
        if (mingoDoesntSearch === true) {
            mingoQuery = new Mingo.Query({});
            search = query.search;
        } else {
            search = utils.json.clone(query.search);
            mingoQuery = new Mingo.Query(query.search || {});
            //search = utils.json.clone(query.search);
        }
        queryHelper.ensure(query);

        let find = mingoQuery.find(data);

        const count = mingoQuery.find(data).count();

        const paginatedOptions = queryHelper.paginate({
            find: find,
            query: query,
            count: count,
        });

        let result = [];
        if (query.limit !== 0) {
            result = find.all();
        } else {
            result = mingoQuery.find(data).all()
        }

        query.search = search;

        queryHelper.response({
            count: count,
            paginatedOptions: paginatedOptions,
            result: result,
            query: query,
            response: response,
        })

    }

    async query(response, schema, query = {}, tempUnionSchemaName) {
        let model;
        try {
            model = mongoose.model(schema);
            let total = mongoose.model(schema);

            queryHelper.ensure(query);

            const originalSearch = query.search;

            if (query.settings.searchModeStartsWith && query.search !== undefined) {
                const queryRegexSearchHelper = require('./helper').queryRegexSearchHelper;
                queryRegexSearchHelper({
                    query: query
                })

            }


            let find = model.find(query.search);

            if (query.hasOwnProperty('restricted')) {
                for(let restrictedField of query.restricted) {
                    find.select('-' + restrictedField);
                }
            }

            if (query.hasOwnProperty('populate')) {
                let request = {
                    body: query
                };
                mongooseUtil.populate(request, find)
            }
            total = total.find(query.search);
            const count = await total.countDocuments().exec();

            const paginatedOptions = queryHelper.paginate({
                find: find,
                query: query,
                count: count,
            });
            const result = await find.exec();

            query.search = originalSearch
            await queryHelper.response({
                count: count,
                paginatedOptions: paginatedOptions,
                result: result,
                query: query,
                response: response,
            })
        } catch (error) {
            this.sendErrorResponse({
                response: response,
                error: error
            })
        } finally {
            if (model !== undefined && tempUnionSchemaName !== undefined) {
                mongoose.dropModel(tempUnionSchemaName);
            }
        }


    }

    /**
     * If there is a general request with id parameter and body, it does automatically.
     * It uses the updateReplaceBody basically.
     * @param request
     * @param result
     * @param model
     * @returns {Promise}
     */
    async updateReplaceBody(request, result, model) {
        await this.updateReplace(result, model, request.params.id, request.body);
    }

    /**
     * Replaces the new data from the model.
     * @param response
     * @param model
     * @param id
     * @param data
     * @returns {Promise}
     */
    async updateReplace(response, model, id, data, schema) {
        ngivrMongoose.clean(data);

        try {
            const document = await model.findById(id).exec();
            Object.assign(document, data);
            await this.save(response, document, model, schema);
        } catch (error) {
            this.sendErrorResponse({
                response: response,
                error: error,
            });
        }
    }

    /**
     * Creates a new model model using express.
     * @param response
     * @param model
     * @param data
     * @returns {Promise}
     */
    async create(response, model, data, schema) {
        try {
            const document = await model.create(data);
            response.status(201).json({
                doc: schema === undefined || global.ngivr.config.settings.populate[schema] === undefined ? document : await model.populate(document, global.ngivr.config.settings.populate[schema])
            });
        } catch (error) {
            this.sendErrorResponse({
                response: response,
                error: error
            });
        }
    }


    /**
     * Deletes data from the DB.
     * @param response
     * @param model
     * @param id
     * @returns {Promise}
     */
    async remove(response, model, id) {
        try {
            const document = await  model.findById(id).exec();
            await document.remove();
            response.status(204).send({
                doc: document
            });
        } catch (error) {
            this.sendErrorResponse({
                response: response,
                error: error,
            });
        }
    }

    /**
     * Creates a 'deleted' flag in the model, instead of remove from the db.
     * @param response
     * @param model
     * @param id
     * @returns {Promise}
     */
    async disable(response, model, id) {
        await this.updateReplace(response, model, id, {deleted: true});
    }

    async trash(response, model, id) {
        return await this.disable(response, model, id)
    }

    /**
     * Saves a document model and send the data to the response.
     * @param response
     * @param document
     */
    async save(response, document, model, schema) {

        document.updatedAt = Date.now();
        await document.save();
        response.status(200).json({
            doc: schema === undefined || global.ngivr.config.settings.populate[schema] === undefined ? document : await model.populate(document, global.ngivr.config.settings.populate[schema])
        });
    }

    /**
     * Inserts many documents to a collection
     * @param response
     * @param data
     * @param schema
     * @returns {Promise}
     */
    async insertMany(response, schema, data) {
        try {
            schema = _.camelCase(schema);
            const modelName = ngivrString.pascalCase(schema);
            const model = mongoose.model(modelName);

            if (!data.hasOwnProperty('docs')) {
                throw new Error(`Undefined docs for insert-many ${schema}`)
            }

            if (data.docs.length < 1) {
                throw new Error(`Empty docs for insert-many ${schema}`)
            }
            const docs = await model.insertMany(data.docs);
            global.ngivr.config.socketio.emit(schema + ':insert-many', {
                docs: docs
            });
            response.status(201).json({
                docs: docs
            });
        } catch (error) {
            this.sendErrorResponse({
                response: response,
                error: error
            });
        }
    }
}

module.exports = new dataHttp();


