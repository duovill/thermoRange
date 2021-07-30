/**
 * Socket.io configuration
 */

'use strict';

const config = require('./environment');
const glob = require('glob');
const jwt = require('../module/util/jwt-promise');

const unauthorizedError = new Error('unauthorized');


module.exports = function (socketio) {
    // socket.io (v1.x.x) is powered by debug.
    // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
    //
    // ex: DEBUG: "http*,socket.io:socket"

    // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
    //
    // 1. You will need to send the token in `client/components/socket/socket.service.js`
    //
    // 2. Require authentication here:
    // socketio.use(require('socketio-jwt').authorize({
    //   secret: config.secrets.session,
    //   handshake: true
    // }));


    // Insert sockets below
    const sockets = glob.sync('server/**/*.socket.js');
    const path = require('path');

    sockets.forEach((file) => {
        file = path.resolve(file);
        if (global.ngivr.config.silent === false) {
            console.info(`Register socket: ${file}`);
        }
        require(file).register(socketio);
    });

    socketio.on('connect', function (socket) {
        const token = socket.handshake.query.token;
        //console.warn('socket.handshake.query.lockId', socket.handshake.query.lockId)
        socket.address = socket.handshake.headers.origin
        socket.connectedAt = new Date();
        socket.lockId = socket.handshake.query.lockId

        const verify = async function (token, next) {
            try {
                if (token === undefined || token === '' || token === null) {
//console.log('token is undefined', 'typeof token', typeof token, token)
                    socket.token = undefined;
                    socket.userId = undefined;
                    throw unauthorizedError;
                }
                if (token === socket.token) {
//console.log('same token - not verify, already verified')
//console.log('current user', socket.userId);
                    if (next) {
                        next()
                    }
                    return;
                }
                if (config.robotToken === token) {
                    socket.token = token;
                    socket.userId = 'robot';
                } else {
//        console.log('SOCKET TOKEN verifying')
                    const decoded = await jwt.verify(token, config.secrets.session);
//        console.log('SOCKET TOKEN verifying arguments', arguments)
//        console.log('token', token);
//        console.log('next', next);
//        console.log('decoded',decoded)
//console.log('SOCKET TOKEN set new token', token)
                    socket.token = token;
                    socket.userId = decoded._id;
                }
                if (next !== undefined) {
                    next();
                }
            } catch (error) {
                socket.token = undefined;
                socket.userId = undefined;
                console.error(error instanceof Error ? error.message : error);
                console.error('SOCKET TOKEN IS INVALID')
//          console.error('SOCKET DISCONNECTED %s', socket.address);
                if (next !== undefined) {
                    next(unauthorizedError);
                }
            }
        }

        verify(token);

        // https://github.com/socketio/socket.io/issues/3678
        socket.on("error", (err) => {
            // to restore the previous behavior
            console.error(err)
            delete err.stack
            socket.emit("error", err);

            // or close the connection, depending on your use case
//            socket.disconnect(true);
        });

        socket.use((packet, next) => {
            const key = packet[0] || undefined;
            let token = socket.token
//            console.log(packet[1] || undefined);

            if (key === 'ngivr-client-log') {
                return next();
            }

            if (key === 'token-new') {
                token = packet[1]
                console.info('SOCKET MIDDLEWARE token new', token)
//        socket.token = 2;
            }

            // for some reason, the unlock happening before clearing the token, we open this action, unsecure, but not wrong
            //console.warn('token', token, 'key', key, 'payload', packet[1], socket.id)
            if (token === undefined && key === 'ngivr-lock-request' && typeof packet[1] === 'object' && packet[1].event === 'ngivr-lock-request' && packet[1].action === 'unlock' && packet[1].id === socket.id) {
                return next();
            }
            verify(token, next)
        });
        console.info('SOCKET CONNECTED %s', socket.address);

        // Call on disconnect.
        socket.on('disconnect', function () {
            console.info('SOCKET DISCONNECTED %s', socket.address);
        });

        socket.on('ngivr-client-log', (data) => {
            try {
                const log = console[data.type];
                data.arguments.unshift(`SocketID: ${socket.id} -`)
                data.arguments.unshift(`LockID: ${socket.lockId} -`)
                data.arguments.unshift('[CLIENT]')
                log.apply(console, data.arguments)
            } catch(e) {
                console.error(e);
            }
        })


        socket.on('ngivr-c2c', (data) => {
            try {
//                console.log('ngivr-c2c', data)
                const ioSendAction = `ngivr-c2c-${data.action}`;
//                console.log(ioSendAction);
                socketio.to(data.toIoId).emit(ioSendAction, data.data);

            } catch(e) {
                console.error(e);
            }
        })




       // require('../module/socket/lock')(socket);
        //require('../module/ngivr-lock/socket').init(socketio);

        //console.log('socket.eventNames()', socket.eventNames())
    });
};
