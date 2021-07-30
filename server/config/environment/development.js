'use strict';

// Development specific configuration
// ==================================
module.exports = {
  workers: 1,
  ip:       process.env.IP || undefined,

  // Server port
  port:      10300,

  // MongoDB connection options
  mongo: {
      uri: process.env.hasOwnProperty('NGIVR_LOCAL') ? 'mongodb://thermo-range-ngivr-dev-user:avUEgj0eksKUnnrzftwWuNABbAEY6rgp@rs0:27017,rs1:27018/thermo-range-ngivr-dev' : 'mongodb://localhost:27017/thermo-range-ngivr-dev',
//    uri: 'mongodb://localhost:27017/thermo-range-ngivr-dev'
},
//Redis
  redis: {
      db: process.env.REDIS_DB||19,           //9000
      scope: process.env.REDIS_SCOPE || ''// 'ngivr-dev:',

  },
};
