const mongoose = require('mongoose');
const dataHttp = require('../data-http');
const ngivrString = require('../../../../client/shared/ngivr-string');
//const mongooseUtil = require('../../util/mongoose');

module.exports = async (request, response) => {
  const schema = ngivrString.pascalCase(request.params.schema);
  // mongooseUtil.ensureModel (schema);
  const model = mongoose.model(schema);

  const simple = request.params.simple;

  const simpleTypes = ['id', 'disable', 'remove', 'trash'];

  try {
      if (!simpleTypes.includes(simple)) {
          throw new Error('Unknown method');
      }
      await require('../override')(request, response, schema, simple);
      if (request.body.ignore !== true) {
          await dataHttp[simple](response, model, request.params.id, request);
      }
  } catch (e) {
    dataHttp.sendErrorResponse({
      response: response,
      error: e,
    });
  }
}
