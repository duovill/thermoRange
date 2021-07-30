const _ = require('lodash');
const fs = require('fs');
module.exports = async (request, response, schema, type) => {
  try {
    //require(`../../api/financialDocument/override/save`)(request, response);
    await require(`../../api/${_.camelCase(schema)}/override/${type}`)(request, response);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e;
    }
  }
}
