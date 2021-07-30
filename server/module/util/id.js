const moment = require('moment');
const utils = require('corifeus-utils');

module.exports = async () => {
  const random = await utils.random(16);

  return `${moment().format('YYYYMMDD-HHmmss-SSS')}-${random}`;
}
