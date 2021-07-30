const dataHttp = require('../data-http');
const _ = require('lodash');
const mongoose = require('mongoose');
const Mingo = require('mingo');
//const mongooseUtil = require('../../util/mongoose');

module.exports = async (request, response) => {

  try {
    let schemaNames = request.params.schemas.split(',');
    const models = [];
    schemaNames.forEach((schema) => {
      const modelName = _.pascalCase(schema);
      // mongooseUtil.ensureModel (modelName);
      models.push(mongoose.model(modelName));
    })


    let query = request.body;
    const queryHelper = require('../data-http/query')
    queryHelper.ensure(query);
//    console.log(query);

    const unionResponse = {
      total: undefined,
      pages: undefined,
      search: undefined,
      limit: undefined,
      sort: undefined,
      docs: undefined,
      page: undefined,
      skip: undefined,
    };
    let stats = {
    }
    await models.forEachAsync(async (unionModel) => {
      //unionModel.ensureIndexes();
      const modelTotal = await unionModel.find(query.search).countDocuments();
      let pages = 0;
      let page = 0;
      let docs = [];
      let skip = 0;
      if (modelTotal > 0) {
        const pages = Math.ceil(modelTotal / query.limit);
        let page = Math.max(1, query.page);
        page = Math.min(pages , page);
        let skip =  (page - 1) * query.limit;
        docs = await unionModel
          .find(query.search)
          .sort(query.sort)
          .skip(skip)
          .limit(query.limit)
          .exec();
      }
//console.log(unionModel.modelName, modelTotal, docs.length);
      const innerStats = {};
      stats[unionModel.modelName] = innerStats;
      innerStats.total = modelTotal;
      innerStats.pages = pages;
      innerStats.page = page;
      innerStats.docs = docs;
      innerStats.skip = skip;
    })
    let total = 0;
    let docs = [];
    Object.keys(stats).forEach(model => {
      const stat = stats[model];
      total += stat.total;
      const docObject = stat.docs.map(doc => {
        doc = doc.toObject();
        //console.log(model);
        doc.ngivrSchemaName = model;
        return doc;
      })
      docs = docs.concat(docObject);
    })
//console.log('all', docs.length);

    const minogQuery = new Mingo.Query();
    const mingoCursor = minogQuery.find(docs)
    mingoCursor.sort(query.sort);

    let maxSlice = query.limit;
    unionResponse.total = total;
    unionResponse.pages = Math.ceil(total / query.limit);
    unionResponse.search = query.search;
    unionResponse.limit = query.limit;
    unionResponse.sort = query.sort;
    unionResponse.page = query.page;
    unionResponse.skip = query.limit * (query.page -1 );
    if (unionResponse.skip + maxSlice > total) {
//      console.log('overflow');
//      console.log('remaind', total - unionResponse.skip);
      maxSlice = total - unionResponse.skip;
    }
    unionResponse.docs = mingoCursor.all().slice(0, maxSlice);
//    unionResponse.stats = stats;
//    unionResponse.docs = docs.slice(0, query.limit);


    response.send(unionResponse)


  } catch (e) {
    dataHttp.sendErrorResponse({
      response: response,
      error: e,
    });

  }


}
