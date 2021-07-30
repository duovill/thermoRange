const mongoose = require('mongoose');
const dataHttp = require('../data-http');
const ngivrString = require('../../../../client/shared/ngivr-string');
const mongooseUtil = require('../../util/mongoose');

module.exports = async (request, response) => {
  const schema = ngivrString.pascalCase(request.params.schema);
  // mongooseUtil.ensureModel (schema);
  const model = mongoose.model(schema);

  await require('../override')(request, response, schema, 'last');

  try {
    await dataHttp.last(response, model, request);
  } catch (e) {
    dataHttp.sendErrorResponse({
      response: response,
      error: e,
    });
  }
}
