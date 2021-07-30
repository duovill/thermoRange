const _ = require('lodash');
const init = (app) => {

  let arenaSetupSkeleton = _.clone(global.ngivr.config.redis);
  arenaSetupSkeleton.hostId = process.env.NODE_ENV;

  const setup = {
    // port, host, db, password
    [process.env.NODE_ENV]: [
      arenaSetupSkeleton
    ],
    "queues": Object.keys(global.ngivr.queue.list).map(queue => {
      const generatedQueue = Object.assign({
        "name": queue,
        "hostId": process.env.NODE_ENV
      }, arenaSetupSkeleton);
      //console.log(generatedQueue)
      return generatedQueue
    })
  }
//console.log(JSON.stringify(setup, null, 4))
  const arena = require('bull-arena')(setup,  {
    basePath: '/arena',
    port: parseInt(global.ngivr.config.port) + 1,
    disableListen: true,
  });
  app.use('/', arena)

}
module.exports.init = init;
