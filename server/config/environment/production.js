'use strict';

// Production specific configuration
// =================================
module.exports = {
    workers: 4,

  // Server IP
  ip:       process.env.IP ||undefined,

  // Server port
  port:     10400,

  // MongoDB connection options
  mongo: {
    uri:    process.env.MONGOLAB_URI ||
            process.env.MONGOHQ_URL ||
            process.env.OPENSHIFT_MONGODB_DB_URL+process.env.OPENSHIFT_APP_NAME ||
            'mongodb://localhost:27017/thermo-range-ngivr'
  },
  //Redis
    redis: {
        db: process.env.REDIS_DB||18,//9080
        scope: process.env.REDIS_SCOPE || '' //ngivr:'
    },

    ekaerUpdate: false,

};
