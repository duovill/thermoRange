const config = require('../../../config/environment');
const mongoose = require('mongoose');
const _ = require('lodash');

const ensure = (query) => {
    query.search = typeof query.search !== 'undefined' ? query.search : undefined;
    query.sort = typeof query.sort !== 'undefined' ? query.sort : {
        [config.settings.query.sort.default.field]: config.settings.query.sort.default.order
    };
    query.limit = typeof query.limit !== 'undefined' ? query.limit : config.settings.query.limit.default;
    query.limit = Math.max(0, query.limit);
    query.page = typeof query.page !== 'undefined' ? query.page : 1;
    query.populate = typeof query.populate !== 'undefined' ? query.populate : undefined;
    query.restricted = typeof query.restricted !== 'undefined' ? query.restricted: [];
    query.manualPopulate = typeof query.manualPopulate !== 'undefined' ? query.manualPopulate: [];
    query.settings = typeof query.settings !== 'undefined' ? query.settings: {
        searchModeStartsWith:  true
    };

};

const paginate = (options) => {
    let {
        sort,
        limit,
        page,
    } = options.query;

    options.pages = Math.ceil(options.count / limit);
    page = Math.max(1, page);
    page = Math.min(options.pages, page);
    let skip = (page - 1) * limit;

    if (skip > 0) {
        options.find.skip(skip);
    }
    options.skip = skip;
    options.find = options.find.limit(limit);
    options.find = options.find.sort(sort);

    return options;
};

const response = async (options) => {

    if (options.query.manualPopulate.length > 0 ) {
        for(let manualPopulate of options.query.manualPopulate) {
            if (!manualPopulate.hasOwnProperty('name')) {
                manualPopulate.name = 'doc';
            }
            const promises = [];
            for(let doc of options.result) {
                const id = doc[manualPopulate.id];
                const schema = _.pascalCase(doc[manualPopulate.schema]);
                console.log('id', id, 'schema', schema);
                const model = mongoose.model(schema);
                const promise = model.findById(id).exec();
                promises.push(promise)
            }
            const manulPopulateResults = await Promise.all[promises]
            console.log(manulPopulateResults)
        }
    }

    //FIXME
    if (options.query.afterQuery) { //TODO optimalizálni, hogy általánosan lehessen alkalmazni
        const depotCtrl = require('../../../api/depot/depot.controller');
        for (let i in options.result) {
            options.result[i] = options.result[i].toObject();
            options.result[i].quantity = await depotCtrl.getQuantities(options.result[i]._id)
        }
    }

    options.response.status(200).send({
        restricted: options.query.restricted,
        total: options.count,
        pages: options.paginatedOptions.pages,
        search: options.query.search,
        limit: options.query.limit,
        sort: options.query.sort,
        docs: options.result,
        page: options.query.page,
        skip: options.paginatedOptions.skip,
        populate: options.query.populate,
        manualPopulate: options.query.manualPopulate,
        afterQuery: options.query.afterQuery,
        settings: options.query.settings
    });

};

module.exports.ensure = ensure;
module.exports.paginate = paginate;
module.exports.response = response;
