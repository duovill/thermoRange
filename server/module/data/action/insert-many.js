const mongoose = require('mongoose');
const dataHttp = require('../data-http');

module.exports = async (request, response) => {
  await require('../override')(request, response, request.params.schema, 'insert-many');
  try {
    return await dataHttp.insertMany(response, request.params.schema, request.body);
  } catch (e) {
    dataHttp.sendErrorResponse({
      response: response,
      error: e,
    });
  }
};
