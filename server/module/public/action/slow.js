const utils = require('corifeus-utils');
module.exports = async (request, response) => {
  console.log(request.query);

  await utils.timer.wait(5000);

  if (request.query.hasOwnProperty('error')) {
    response.status(500).json({
      status: 'error',
      date: new Date()
    });
  } else {
    response.status(200).json({
      status: 'ok',
      date: new Date()
    });

  }

}
