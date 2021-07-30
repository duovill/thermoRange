const register = (socketio) => {

    let sendLocksDebounce;
    socketio.on('connect', function (socket) {

        console.log(`NGIVR LOCK SOCKET IS INITIALIZED}`)

        const sendLocks = () => {

            const debouncingSendLock = async () => {
                try {

                    const RedisLock = require('./redis-lock');
                    const locks = await RedisLock.getLocks();

                    console.log(`ngivr-lock-response-get-locks sent`)

                    global.ngivr.socketio.emit('ngivr-lock-response-get-locks', {
                        locks: locks
                    })
                } catch (e) {
                    console.error(e);
                }
            }

            clearTimeout(sendLocksDebounce)
            sendLocksDebounce = setTimeout(debouncingSendLock, global.ngivr.config.settings.debounce);

        }
        module.exports.sendLocks = sendLocks;

        socket.on('ngivr-lock-request-get-locks', () => {
            console.log('ngivr-lock-request-get-locks requested')
            sendLocks();
        })

        socket.on('ngivr-lock-request', async (data) => {
            console.log('ngivr-lock-request', data.action)
            try {
                data.emit = data.emit === undefined ? true : data.emit

                const RedisLock = require('./redis-lock');

                if (!data.hasOwnProperty('requestId')) {
                    throw new Error(`REDIS-LOCK: ngivr-lock-request, data.requestId is missing or not unique`)
                }
//console.log(data);
                switch(data.action) {

                    case 'get-all-locks':
                        const locksAll = await RedisLock.getLocks();
                        global.ngivr.socketio.emit(`ngivr-response-${data.requestId}`, {
                            locks: locksAll
                        })
                        break;

                    case 'unlock':
                        let errorTopUnlock;
                        const errorsTopUnlock = [];
                        try {
                            await data.locks.forEachAsync(async (lockedLock) => {
                                try {
//                                    console.log('lockedLock', lockedLock)
                                    const resultUnlock = await RedisLock.unlock(lockedLock.resource, lockedLock.value, true)
//                                    console.log(resultUnlock);
                                } catch(e) {
                                    console.error(e);
                                    errorsTopUnlock.push(e);
                                    errorTopUnlock = e;
                                }
                            })
                        } catch(e) {
                            console.error(e);
                            errorsTopUnlock.push(e);
                            errorTopUnlock = e;
                        } finally {
                            global.ngivr.socketio.emit(`ngivr-response-${data.requestId}`, {
                                error: errorTopUnlock,
                                errors: errorsTopUnlock,
                            })

                            if (data.emit) {
                                sendLocks();
                            }
                        }
                        break;

                    case 'lock':

                        const lockedLocks = []
                        let errorTopLock;
                        const errorsTopLock = [];
                        try {
                            for(let resourceData of data.resource) {
//console.log(resourceData.resource, data.userId, data.ttl, data.extended, data.id, true)
                                let user = data.userId;
                                if(data.extended)  {
                                    for (let lockSubscribedInstance of data.locksMySubcribed.locks) {
                                        if (lockSubscribedInstance.doc === resourceData.resource) {
                                            user = `${lockSubscribedInstance.user}:${socket.lockId}:${lockSubscribedInstance.nickName}`
                                            break;
                                        }
                                    }
                                }
                                const lock = await RedisLock.lock(resourceData.resource, user, data.ttl, data.extended, data.id, true, data.instanceId)

                                lockedLocks.push(lock)
                            }
                        } catch(error) {
                            console.error(error);
                            errorTopLock = error;
                            errorsTopLock.push(error);
                        } finally {
//                            console.log(lockedLocks);
                            if (errorTopLock !== undefined) {
                                await lockedLocks.forEachAsync(async (lockedLock) => {
                                    try {
                                        await RedisLock.unlock(lockedLock.resource, data.userId, data.instanceId)
                                    } catch(e) {
                                        console.error(e);
                                        errorTopLock = e;
                                        errorsTopLock.push(e);
                                    }
                                })
                            }

                            global.ngivr.socketio.emit(`ngivr-response-${data.requestId}`, {
                                locks: lockedLocks,
                                error: errorTopLock,
                                errors: errorsTopLock,
                            })

                            if (data.emit) {
                                sendLocks();
                            }
                        }
                        break;
                }

            } catch(e) {
                console.error(e);
                if (data.hasOwnProperty('requestId')) {
                    global.ngivr.socketio.emit(`ngivr-response-${data.requestId}`, {
                        error: e,
                    })
                }
            }
        })


        //FIXME deprecated
        /*
         * @deprecated since version 0.6.300
         */
        socket.on('ngivr-lock-request-extend-lock', async (lockData) => {
            try {
                console.log(`ngivr-lock-request-extend-lock !!!!!!!!!!!! DEPRECATED !!!!!!!!!!!!!`)
                const RedisLock = require('./redis-lock');
//        console.log('ngivr-lock-request-extend-lock', lockData)
//        console.log('RedisLock.extend', 'resource', lockData.resource, 'user', lockData.user, 'ttl', lockData.ttl, 'id', lockData.id)
                await RedisLock.extend(lockData.resource, lockData.user, lockData.ttl, lockData.id)

            } catch (e) {
                console.error(e);
            }
        })

        const unlockAll =  async () => {
            try {
                const redis = global.ngivr.redis;
                //console.log('ngivrlock-unlock-all', socket.userId, socket.lockId);
                const deletableValue = `${socket.userId}:${socket.lockId}`;
                const match = `${ngivr.config.redis.scope}lock:*`;
                //console.log(`ngivr-lock auto lock with match: ${match}`)
                const stream = redis.scanStream({
                    match: match,
                });
                let deletableKeys = [];
                stream.on('data', (keys) => {
                    deletableKeys = deletableKeys.concat(keys);
                });

                stream.on('end', async () => {
                    //console.log('redis-lock unlock all done with the deletable keys: ', deletableKeys);
                    try {
                        await deletableKeys.forEachAsync(async (deletableKey) => {
                            try {
                                let value = await redis.get(deletableKey);
                                value = value.split(':')
//                                const originalValue = value;
                                value.pop();
                                value.pop();
                                value.pop();
                                value = value.join(':');
//console.log('redis-lock unlock all', 'value', value, 'deletableValue', deletableValue, 'found?', value === deletableValue)
                                if (value === deletableValue) {
//console.log('redis-lock unlock key', deletableKey)
                                    await redis.del(deletableKey);
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        })

                    } catch(e) {
                        console.error(e)
                    } finally {
                        sendLocks();
                    }
                });
            } catch (e) {
                console.error(e);
            }
        }

        socket.on('disconnect', () => {
            console.log('ngivr-lock disconnect');
            unlockAll()
        });

        socket.on('ngivr-lock-request-interaction-auto-unlock', () => {
            console.log('ngivr-lock-request-interaction-auto-unlock');
            unlockAll();
        })


        console.log('ngivr-lock connected')
    })

}

module.exports.register = register;
module.exports.sendLocks = () => {
};
