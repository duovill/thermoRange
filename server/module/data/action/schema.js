const mongoose = require('mongoose');
const ngivrString = require('../../../../client/shared/ngivr-string');
//const mongooseUtil = require('../../util/mongoose');
const JSON = require('circular-json');

module.exports = (request, response) => {
  const schema = ngivrString.pascalCase(request.params.schema);
  // mongooseUtil.ensureModel (schema);
  const model = mongoose.model(schema);

  response.setHeader('Content-Type', 'application/json');
  response.send(JSON.stringify(model.schema));
  /*
   response.json(model.schema);
  */
}
