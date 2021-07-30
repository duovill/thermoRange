require('corifeus-utils');
const fsOld = require('fs')
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.hasOwnProperty('NODE_ENV') && process.env.NODE_ENV === 'development') {
    Error.stackTraceLimit = 50
} else {
    Error.stackTraceLimit = 25
}

const chalk = require('chalk')

if (!process.env.hasOwnProperty('NGIVR_MIGRATION')) {


    require('console-stamp')(console, {
        format: ':date(yyyy/mm/dd HH:MM:ss.l).cyan :p3x.yellow :myLabel',
        tokens:{
            p3x: () => {
                let base;
                if (cluster.isWorker) {
                    const baseName = process.env.NGIVR_SERVER_COMMAND.toUpperCase();
//console.log(process.env)
                    switch (process.env.NGIVR_SERVER_COMMAND) {
                        case 'worker':
                            base = `[${baseName} ${_.padStart(cluster.worker.id, 3, 0)}]`
                            break;

                        case 'singleton':
                            base = `[${baseName}]`
                            break;

                        default:
                            throw new Error(`Unknown fork command: ${process.env.NGIVR_SERVER_COMMAND}`)
                    }
                } else {
                    base = `[MASTER]`;
                }
                return chalk`{black.grey ${base.padStart(12, ' ')}}` + ` [PID: ${(String(process.pid).padStart(6, 0))}] `;
            },
            myLabel: ( arg ) => {
                const { method, defaultTokens } = arg;
                let label = defaultTokens.label( arg );
                switch(method) {
                    case 'error':
                        label = chalk`{bold.red ${label}}`;
                        break;

                    case 'warn':
                        label = chalk`{bold.blue ${label}}`;
                        break;

                    default:
                        label = chalk`{green ${label}}`;
                }
                return label;
            }
        },
    });



}

const _ = require('lodash');
const cluster = require('cluster');
const config = require('./config/environment');

let migrationItem = process.argv[2]
let migrationItemInt
const migrationForce = process.argv[3]
const migrationNoUpdate = process.argv[4] || process.argv[3]
if (process.env.hasOwnProperty('NGIVR_MIGRATION')) {
    migrationItemInt = parseInt(migrationItem)
    migrationItem = migrationItem.padStart(4, '0')
    if (fsOld.existsSync(`./server/config/local.env.js`)) {
        const allowedChangeMigrationMongooseUrl = [
            '0001'
        ]
        if (allowedChangeMigrationMongooseUrl.includes(migrationItem)) {
            const URL = require('url').URL
            const url = new URL(config.mongo.uri)
            url.pathname = '/ngivr'
            config.mongo.uri = url.toString()
        }
    }
}

global.ngivr = {};
global.ngivr.translation = 'hu';
global.ngivr.config = config;

global.ngivr.http = {
    sendErrorResponse: (options) => {
        // ezt betolti amikor express van, itt:
        // server/module/data/data-http/index.js legutolso sor
        const {response, error} = options;
        console.error(error);
        response.status(options.status || 500).send({
            result: options.result || 'error',
            message: error.message,
            error: error,
        });
        return error;
    }
};
global.ngivr.handleError = function(res, err, state = 500) {
    if ((res !== undefined && typeof res.send !== 'function') || (err !== undefined && typeof err.send === 'function')) {
        const swap = res
        res = err
        err = swap
    }
    if (err.name !== 'error'  && !err.hasOwnProperty('message')) {
        if (typeof err === 'object') {
            err = JSON.stringify(err);
        }
        err = new Error(err);
    }
    console.error(err);

    if (res === undefined) {
        return err;
    }
    return res.status(state).send(err);
}


global.ngivr.strings = require(`../client/shared/translation/${global.ngivr.translation}/ngivr-strings.js`)
if (cluster.isMaster) {
    if (global.ngivr.config.silent) {
        console.info(`

====================================================
NGIVR Silent Mongoose debug and express log is off.
====================================================
`)
    }
    console.info(`

=================================================================================
NGIVR Spawns ${config.workers} workers besides of the singleton and the master.
=================================================================================
`)
}


const serverErrorHandler = require('./server-error-handler')
serverErrorHandler.init();
const catchError = serverErrorHandler.catchError;

if (cluster.isMaster && !process.env.hasOwnProperty('NGIVR_NO_CLUSTER') && !process.env.hasOwnProperty('NGIVR_MIGRATION')) {
    return require('./master')
}

//require('./debug');


require('./module/util/decorate');

const mongooseUtil = require('./module/util/mongoose');
const fs = require('mz/fs');
const ngivrString = global.ngivr.strings
const mongoose = require('mongoose');


console.log('Server environment: %s', process.env.NODE_ENV);
console.log('Database: %s', config.mongo.uri);

// Connect to database
mongoose.Promise = global.Promise;
/*
const uniqueValidator = require('mongoose-unique-validator');
mongoose.plugin(uniqueValidator, {
    message: ngivrString.mongoose.unique
});
 */

require('./module/singleton/boot')

if (process.env.NODE_ENV === 'development' || process.env.hasOwnProperty('NGIVR_MIGRATION')) {


    if (global.ngivr.config.silent === false) {
        mongoose.set('debug', (collectionName, methodName, docs, options) => {

            const log = `${chalk.blue('[MONGOOSE]')} ${chalk.yellow(collectionName)}.${chalk.magenta(methodName)} ${Array.isArray(docs) ? 'Docs:' + docs.length : 'Doc: ' + JSON.stringify(docs)}`;
            console.info(log);
        });
    }

    if ((process.env.NGIVR_SERVER_COMMAND === 'singleton' || process.env.NGIVR_CLUSTER === undefined) && !process.env.hasOwnProperty('NGIVR_MIGRATION')) {

        // delete export pdfs
        const globs = [
            './export/pdf/**',
            '!./**/placeholder.txt',
        ];

        if (global.ngivr.config.silent === false) {
            console.info('Development delete files', globs)
        }
        const globby = require('globby')
        const files = globby.sync(globs)
        files.forEach((file) => {
            if (global.ngivr.config.silent === false) {
                console.info(`Delete file ${file}`)
            }
            fs.unlink(file)
        })

        const generateTestGeneratePdf = () => {
            // generate test generate pdf file incoming invoice
            const fsExtra = require('fs-extra')
            const incomingPdfDir = require('./module/singleton/helper').incomingPdfDir()
            let incomingPdfIndex = 0
            for(let incomingPdfFile of [ngivr.config.repoRoot + '/test/hand-crafted/pdf2qr/input4.pdf', ngivr.config.repoRoot + '/test/hand-crafted/pdf2qr/input5.pdf']) {
                fsExtra.copySync(incomingPdfFile, incomingPdfDir.pdfIncoming + '/' + (incomingPdfIndex++) + '.pdf')
            }
        }
        //generateTestGeneratePdf()
    }
}

//console.info('config', config)
//console.info('mongoose connect', config.mongo.uri, config.mongo.options)

mongooseUtil.schemaAuto();

mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.set('useCreateIndex', true)

mongoose.connection.on('error', function (err) {
    console.error('MongoDB connection error: ' + err);
    catchError(err);
});

const mongooseConnected = (options = {}) => {

    mongoose.connection.on('connected', async function () {
        console.log('MongoDB connected');
        mongooseUtil.modelAuto();

        if (options.hasOwnProperty('afterConnected')) {
            setTimeout(() => {
                options.afterConnected(options);
            }, 2000)
        }
    });


}

if (process.env.hasOwnProperty('NGIVR_MIGRATION')) {
    mongooseConnected({
        afterConnected: async (options) => {
            try {
                const migrationFiles = await globby([
                    `./server/migration/${migrationItem}-*`,
                ]);
                const cwd = process.cwd()
                for(let migrationRequire of migrationFiles) {

                    const pkgName = `${process.cwd()}/package.json`
                    const pkg = JSON.parse(fs.readFileSync(pkgName))
                    let savePkg = false;
                    if (!pkg.hasOwnProperty('ngivr')){
                        pkg.ngivr = {}
                        savePkg = true
                    }
                    if (!pkg.ngivr.hasOwnProperty('migration')){
                        pkg.ngivr.migration = 0
                        savePkg = true
                    }
                    if (pkg.ngivr.migration > migrationItemInt - 1 && migrationForce !== 'force') {
                        throw new Error (`
Please make sure,
you are sure to execute this migration,
your current migration version is ${pkg.ngivr.migration} and youre executing ${migrationItemInt}.
To enforce this migration, after you migration number add the 'force' argument eg.
NODE_ENV=production NGIVR_CLUSTER=1 NGIVR_LOCAL=1 NGIVR_MIGRATION=1 TZ=Europe/Budapest NGIVR_WORKERS=1 PORT=9000 node server/app.js 1 force

`)
                    }
                    console.log(`Migration starts ${migrationRequire}`)

                    const migrationFunction = require(`${cwd}/${migrationRequire}`)
                    await migrationFunction(options)

                    if (pkg.ngivr.migration === migrationItemInt - 1) {
                        pkg.ngivr.migration = migrationItemInt
                        savePkg = true
                    } else {
                        console.log(`
This migration was using with force, so the package is not updated.
`)
                    }


                    console.log(`
Migration arguments:
Arg0 migrationItem       : ${migrationItem}
Arg0 migrationItemInt    : ${migrationItemInt}
Arg1 migrationForce      : ${migrationForce}
Arg2 migrationNoUpdate   : ${migrationNoUpdate}
`)

                    if (savePkg) {
                        console.log(`
The package.json is saved (either migration was by right or missing a pkg property).
`)
                        if (migrationNoUpdate !== 'noupdate') {
                            fs.writeFileSync(pkgName, JSON.stringify(pkg, null, 4))
                        } else {
                            console.log('Saving package is disabled by the "noupdate" argument.')
                        }
                    }

                    console.log('Migration was successful.')
                }

            } catch(e) {
                console.error(e)
            } finally {
                process.exit(0)
            }
        }
    });
    return;
}

//redis pub/sub and client (SINGLETON)!
//üzenetküldés, feliratkozás: lásd a modulban!
const Redis = require('ioredis');
Redis.Promise = require('bluebird');

const redis = new Redis(config.redis);
const redisSubscriber = new Redis(config.redis);
global.ngivr.redis = redis;
global.ngivr.redisSubscriber = redisSubscriber;

global.ngivr.redis.setMaxListeners(0);
global.ngivr.redisSubscriber.setMaxListeners(0);

let redisPubSub = require('./module/redis-pub-sub/redis-pub-sub')(config.redis);
let events = require("events").EventEmitter;
let emitter = new events();
const express = require('express');
const app = express();


if (process.env.NGIVR_SERVER_COMMAND === 'worker' || process.env.NGIVR_CLUSTER === undefined) {

    mongooseConnected();

    app.enable('trust proxy')

    // Setup server
// mivel init, lehet hasznalni a readFileSync-et, de boot utan nem!!!!
    const originalFs = require('fs')
//    const spdy = require('spdy');
    /*
    const server = spdy.createServer({
        key: originalFs.readFileSync(`${__dirname}/config/localhost-privkey.pem`),
        cert: originalFs.readFileSync(`${__dirname}/config/localhost-cert.pem`),
    }, app)
    */
    var server = require('http').createServer(app);




    const socketio = require('socket.io')(server, {
        serveClient: true,
        secure: true,
        path: '/socket.io',
    });

    global.ngivr.socketio = socketio;

    if (process.env.NGIVR_CLUSTER !== undefined) {
        console.log('SOCKET USING socket.io-redis')
        const socketIoRedis = require('socket.io-redis');
        socketio.adapter(socketIoRedis({
            key: global.ngivr.config.secrets.session,
            host: config.redis.host,
            port: config.redis.port,
            db: config.redis.db,
            password: config.redis.password,
//      key: config.redis.scope + ':socket.io',
            pubClient: global.ngivr.redis,
            subClient: global.ngivr.redisSubscriber,
        }));
    }

    app.locals.config = config;
    app.locals.redis = redis;
    app.locals.redisSubscriber = redisSubscriber;
    app.locals.config.socketio = socketio;
    app.locals.errorHandler = (res, err) => {
        res.status(500).send({
            status: 'error',
            message: err,
        });
    }
    app.locals.config.eventEmitter = emitter;
    // global.ngivr.config = app.locals.config

// nagyon fontos,
// hogy elotte toltodjon a schema-ban a model elott,
// pl socketio (pre save)
    require('./config/socketio')(socketio);
    require('./module/queue').init();


    require('./config/express')(app);
    require('./routes')(app);


//beolvassa  a master/slave konfigurációt az adatbázisból
    require('./config/master.slave').refreshData(); //returns a Promise!


// Start server

    server.listen(config.port, config.ip, function () {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });

}

//a singleton processben is kell a socketio mert a ping/kliensek ellenőrzése itt fut
//közvetlen kliens kapcsolat ide nem fut be, de a socket.io-redis-en keresztül megy a broadcast
if (process.env.NGIVR_SERVER_COMMAND === 'singleton' || process.env.NGIVR_CLUSTER === undefined) {
    if (process.env.NGIVR_SERVER_COMMAND === 'singleton') {
        /*
        const socketio = require('socket.io')({
          serveClient: true,
          secure: true,
          path: '/socket.io',
        });
        const socketIoRedis = require('socket.io-redis');
        socketio.adapter(socketIoRedis({
          host: 'localhost',
          port: 6379,
          db: config.redis.db,
    //      key: config.redis.scope + ':socket.io',
          pubClient: global.ngivr.redis,
          subClient: global.ngivr.redisSubscriber,
        }));
        ngivr.socketio = socketio;
        */
        // https://socket.io/docs/rooms-and-namespaces/#sending-messages-from-the-outside-world
        console.log('SOCKET USING socket.io-emitter')
        const socketio = require('socket.io-emitter')({
            key: global.ngivr.config.secrets.session,
            host: config.redis.host,
            port: config.redis.port,
            db: config.redis.db,
            password: config.redis.password,
//      key: config.redis.scope + ':socket.io',
            pubClient: global.ngivr.redis,
            subClient: global.ngivr.redisSubscriber,
        });
        global.ngivr.socketio = socketio;

        if (config.redis.hasOwnProperty('password') && config.redis.password !== undefined && config.redis.password !== '') {
            socketio.redis.auth(config.redis.password)
        }
        socketio.redis.setMaxListeners(0);
        socketio.redis.stream.setMaxListeners(0);

        mongoose.connection.on('connected', async function () {
            console.log('MongoDB connected Singleton');
            mongooseUtil.modelAuto();
            require('./module/queue').init();
            require('./module/schedule').Boot();
        });

        mongoose.connection.on('error', function (err) {
            console.error('MongoDB connection error: ' + err);
            catchError(err);
        });

    } else {
        require('./module/queue').init();
        require('./module/schedule').Boot();
    }

}
//console.warn('GLOBAL:NHIVR.CONFIG', global.ngivr.config)
module.exports = app;
