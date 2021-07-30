const _ = require('lodash');
const path = require('path')
const glob = require('glob');
const email = require('../email')();

const Queue = require('bull');
const kues = {};

const Redis = require('ioredis');
const utils = require('corifeus-utils');

const cluster = require('cluster');

const opts = {
//  prefix: `${global.ngivr.config.redis.scope}queue`,
//  redis: global.ngivr.config.redisUrl,
    createClient: function (type) {
        switch (type) {
            case 'client':
                return global.ngivr.redis;
            case 'subscriber':
                return global.ngivr.redisSubscriber;
            default:
                return new Redis(global.ngivr.config.redis);
        }
    }
}

let countErrorWeird = 0;
const queue = (named, processor) => {

    if (!kues.hasOwnProperty(named)) {

        kues[named] = Queue(named, opts);

        if (process.env.NGIVR_SERVER_COMMAND === 'singleton' || cluster.isMaster) {


            kues[named].process(processor);

            const countErrorWeirdMax = 10;

            kues[named].on('error', (error) => {
                let isWeirdError = false;
                if (error.message === 'Cannot read property \'0\' of null') {
                    isWeirdError = true;
                    countErrorWeird++;
                    return;
                }
                if (!isWeirdError || countErrorWeird >= countErrorWeirdMax) {
                    console.error(error)
                    email.send({
                        subject: `NGIVR Queue error ${named} on ${global.ngivr.config.env}`,
                        body: {
                            date: new Date().toLocaleString(),
                            error: error,
                        }
                    });
                }
                if (countErrorWeird >= countErrorWeirdMax) {
                    countErrorWeird = 0;
                }
            })

            kues[named].on('stalled', async function (job) {

                console.error(job)

                const sendData = {
                    subject: `NGIVR Queue stalled ${named} on ${global.ngivr.config.env}`,
                    body: {
                        date: new Date().toLocaleString(),
                        job: job,
                    }
                };

                email.send(sendData);

            })

            kues[named].on('failed', async function (job, err) {

                console.error(job, err)

                email.send({
                    subject: `NGIVR Queue failed ${named} on ${global.ngivr.config.env}`,
                    body: {
                        date: new Date().toLocaleString(),
                        err: err,
                        job: job,
                    }
                });

            })

            kues[named].on('completed', function (job, result) {
                console.log();
                console.log(`Job completed ${JSON.stringify(job.data, null, 4)}`)
                console.log();
            })

        }
    }
    kues[named].clean(1000 * 60 * 60 * 24);

    return kues[named];
}

const lock = async (options) => {

    const {resolve, reject, promise} = utils.promise.deferred()
    let execError, execResult;

    let {name, exec, request, response, timeout} = options;

    if (timeout === undefined) {
        timeout = global.ngivr.config.queue.lock.timeout;
    }

    if (request !== undefined) {
        request.setTimeout(0)
    }

    const queueLockName = `queue-lock-${name}`;

    const requestId = `${queueLockName}-${utils.random.complexUuid()}`;

//console.log();
//console.log(requestId);
//console.log();

//  const subscriber = new Redis(global.ngivr.config.redis);
    const subscriber = global.ngivr.redisSubscriber;

    let finallyCallbackCalled = false;
    const finallyCallback = () => {
        finallyCallbackCalled = true;
        //          subscriber.disconnect()
        clearTimeout(timeoutQueueLockCancel);
        global.ngivr.redis.publish(requestId, JSON.stringify({
            status: 'ok',
            action: 'done',
            requestId: requestId,
            name: name,
        }))
        subscriber.removeListener('message', onMessage)
        subscriber.unsubscribe(requestId)

        if (execError === undefined) {
            resolve(execResult)
        } else {
            reject(execError)
        }
    }

    const responseSendError = (options) => {
        let {message} = options || {};
        response.status(500).json({
            status: 'error',
            error: execError,
            message: message,
            queueLockName: queueLockName,
        })
        response.status = () => {
        };
        response.send = () => {
        };
        response.json = () => {
        };
    }

    const onMessage = (channel, message) => {
        message = JSON.parse(message);

//    console.log();
//    console.log(message);
//    console.log();

        if (channel === requestId && message.action === 'exec') {
            const onInit = async () => {
                try {
                    execResult = await exec()
                } catch (error) {
                    console.error(error)
                    execError = error
                    if (response !== undefined) {
                        responseSendError({
                            error: error,
                            message: message,
                        });
                    }
                } finally {
                    finallyCallback()
                }
            }
            onInit();
        }
    }

    subscriber.subscribe(requestId, (error, result) => {
        if (error) {
            console.error(error)
            email.send({
                subject: `NGIVR Queue subscribe error ${queueName} on ${global.ngivr.config.env}`,
                body: {
                    date: new Date().toLocaleString(),
                    error: error,
                }
            });
//      subscriber.disconnect()
            subscriber.removeListener('message', onMessage)
            subscriber.unsubscribe(requestId)
        }
    })

    subscriber.on('message', onMessage)

    queue(queueLockName).add({
        requestId: requestId,
        name: name,
    })

    const timeoutQueueLockCancel = setTimeout(() => {
        if (execError === undefined) {
            execError = new Error(`Timeout of ${queueLockName} in ${timeout}ms.`);
        }
        if (response !== undefined) {
            responseSendError();
        }
        finallyCallback()
    }, timeout)

    return promise
    /*
    return {
        requestId: requestId,
        name: name,
        promiseExec: promise,
    }
    */
}

global.ngivr.queue = queue;

global.ngivr.queue.lock = lock;

global.ngivr.queue.list = kues;

module.exports.init = () => {

    const queueKeys = glob.sync('server/module/queue/key/**/*.js');
    queueKeys.forEach((file) => {
        file = path.resolve(file);
        if (global.ngivr.config.silent === false) {
            console.info(`Register queue: ${file}`);
        }
        require(file);
    });
    global.ngivr.config.queue.lock.named.forEach(name => {
        global.ngivr.queue.lock.init(name);
    })
}

global.ngivr.queue.lock.init = (name) => {

    const queueName = `queue-lock-${name}`;

    return global.ngivr.queue(queueName, (job, done) => {

        const {requestId, name} = job.data;
//    const subscriber = new Redis(global.ngivr.config.redis);
        const subscriber = global.ngivr.redisSubscriber;

        const onMessage = (channel, message) => {
//      console.log()
//      console.log(message)
//      console.log()
            message = JSON.parse(message);
            if (channel === requestId && message.action === 'done') {
                done();
//        subscriber.disconnect()
                subscriber.removeListener('message', onMessage)
                subscriber.unsubscribe(requestId)
            }
        };

        subscriber.subscribe(requestId, (error, result) => {
            if (error) {
                console.error(error)
                email.send({
                    subject: `NGIVR Queue subscribe error ${queueName} on ${global.ngivr.config.env}`,
                    body: {
                        date: new Date().toLocaleString(),
                        error: error,
                    }
                });
//        subscriber.disconnect()
                subscriber.removeListener('message', onMessage)
                subscriber.unsubscribe(requestId)
                done(error);
            }
        })

        subscriber.on('message', onMessage)

        global.ngivr.redis.publish(requestId, JSON.stringify({
            status: 'ok',
            action: 'exec',
            requestId: requestId,
            name: name,
        }))
    })

}

