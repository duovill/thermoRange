const dataHttp = require('../data-http');
const ngivrString = require('../../../../client/shared/ngivr-string');
//const mongooseUtil = require('../../util/mongoose');

module.exports = async (request, response) => {

  try {
    const schema = ngivrString.pascalCase(request.params.schema);
    // mongooseUtil.ensureModel (schema);
    await require('../override')(request, response, schema, 'query');
    if (!request.body.ignore) {
      return dataHttp.query(response, schema, request.body);
    }


  } catch (e) {
    dataHttp.sendErrorResponse({
      response: response,
      error: e,
    });
  }
}
