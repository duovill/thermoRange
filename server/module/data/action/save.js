const mongoose = require('mongoose');
const dataHttp = require('../data-http');
const ngivrString = require('../../../../client/shared/ngivr-string');
//const mongooseUtil = require('../../util/mongoose');

module.exports = async (request, response) => {

  try {
    const schema = ngivrString.pascalCase(request.params.schema);
    // mongooseUtil.ensureModel (schema);
    const model = mongoose.model(schema);

    await require('../override')(request, response, schema, 'save');

    if (!request.body.ignore) {
      if (request.body.hasOwnProperty('_id')) {
        return dataHttp.updateReplace(response, model, request.body._id, request.body, request.params.schema);
      } else {
        return dataHttp.create(response, model, request.body, request.params.schema);
      }
    }

  } catch (e) {
    if (!request.body.ignore) {
      dataHttp.sendErrorResponse({
        response: response,
        error: e,
      });
    }

  }

};
