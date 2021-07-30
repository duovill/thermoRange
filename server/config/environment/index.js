'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const cluster = require('cluster');
const execSync = require('child_process').execSync;
const validator = require("email-validator");


const _ = require('lodash');

let root = path.normalize(__dirname + '/../../..');
const checkPath = path.normalize(root + '/..');
let exportPath = path.normalize(root + '/export');
let repoRoot  = process.cwd()
if (fs.existsSync(checkPath + '/dist')) {
    exportPath = path.normalize(checkPath + '/export');
    repoRoot = path.resolve(repoRoot + '/..')
}


const envConfig = require('./' + process.env.NODE_ENV + '.js');

let nodemailer = {
    "from": "ngivr@sygnus-dev.inb.hu",
    "to": "system@sygnus-dev.inb.hu",
//      "to": "me@patrikx3.com",
    "config": {
        "host": "mail.impressive.hu",
        "port": 465,
        "secure": true,
        "auth": {
            "user": "ngivr@sygnus-dev.inb.hu",
            "pass": "Sygnus12345"
        },
    },
}

// ha jo mar a impressive mail, akkor ezt csak kikommentelni
nodemailer = {
    "from": "ngivr@patrikx3.com",
    "to": "ngivr-admin@patrikx3.com",
    "config": {
        "host": "mail.patrikx3.com",
        "port": 465,
        "secure": true,
        "auth": {
            "user": "ngivr@patrikx3.com",
            "pass": "UxuJ03jogDMZMbIgylBO30kqpwmEBvDm"
        },
    },
}

let workers = os.cpus().length
workers = 3

if (process.env.NGIVR_LOCAL === '1') {

    let to = "me@patrikx3.com"

    const userEmail = execSync(`git config user.email`).toString().trim();

    if (validator.validate(userEmail)) {
        to = userEmail;
    }

    const sentAboutSendingEmail = () => {
        console.info('A hibak ezeknek a felhasznaloknak kuldoknek:', to)
    }

    setInterval(sentAboutSendingEmail, 60000 * 60)
    setTimeout(sentAboutSendingEmail, 1000)

    nodemailer.to = to
}


// All configurations will extend these options
// ============================================
const all = {

    workers: workers,

    nodemailer: nodemailer,

    silent: false,

    /*
    nodemailer: ,
  */
    isLocal: process.env.NGIVR_LOCAL === '1',
    env: process.env.NODE_ENV,

    // Root path of server
    root: root,

    // Root path of server
    exportPath: exportPath,

    repoRoot: repoRoot,


    incoming: {
        erroredRecognizeQrTimeout: 1000 * 60 * 60 * 2, // 2 hours to notify
        dir: {
            pdfIncoming: 'build/incoming-pdf',
            pdfArchived:  'build/incoming-pdf-archived',
            pdfInvalid:  'build/incoming-pdf-invalid',
        }
    },

    // Server port
    port: process.env.PORT || 10300,

    // Server IP
    ip: process.env.IP || '0.0.0.0',

    // Secret for session, you will want to change this and make it an environment variable
    secrets: {
        session: 'ng-ivr-thermo-range-secret-ALPHA-BRAVO-23645871872-' + process.env.NODE_ENV
    },

    // List of user roles
    //userRoles: ['Admin global', 'Admin logisztikus', 'Logisztikus', 'Vezető kereskedő', 'Kereskedő', 'Vezető', 'Kikötőmester', 'Hedger', 'Mérleg'],

    // MongoDB connection options
    mongo: {
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            //useNewUrlParser: true,
//      useMongoClient: true,
            /*
            server: {
              socketOptions: {
                keepAlive: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 10000
              }
            },
            db: {
              safe: true
            }
            */
        }
    },


    //Redis connection options
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDDIS_PORT || '6379',
        password: process.env.REDIS_PWD || '',
        url: process.env.REDIS_URL || '',
        scope: process.env.REDIS_SCOPE || '', // 'ngivr-default:',
        db: process.env.REDIS_DB || 19//9000
    },

    settings: require('../../../client/shared/ngivr-settings'),

    queue: {
        lock: {
            timeout: 20000,
            named: [
                'ticket'
            ]
        }
    },


    robotToken: 'hVTTICv9jlbPMdDJtt1AThVrRNpC5OX7jwW4Jf575V5h8VI891uD9IV4thpkiuGn',
    robotTimeout: 20 * 60 * 100,
};

if (process.env.NODE_ENV === 'development') {
    all.queue.lock.named.push('test');
}

// Export the config object based on the NODE_ENV
// ==============================================
let config = _.merge(all, envConfig);

if (process.env.hasOwnProperty('NGIVR_WORKERS')) {
    config.workers = parseInt(process.env.NGIVR_WORKERS);
}

if (process.env.hasOwnProperty('NGIVR_SILENT')) {
    config.silent = true;
}

config.socketLockList = 'socket-lock-list';
config.redis.keyPrefix = config.redis.scope;


const localEnvConfigFile = `${__dirname}/../local.env.js`;
if (fs.existsSync(localEnvConfigFile)) {
    const localEnvConfig = require(localEnvConfigFile)
    config = _.merge(config, localEnvConfig);
}

module.exports = config;
