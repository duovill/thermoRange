const cluster = require('cluster');
const os = require('os')

const start = async () => {

//  console.log('process.title', process.title)
//  console.log('process.arch', process.arch)
//  console.log('process.platform', process.platform)
//   console.log('process.config', process.config)
//  console.log('process.version', process.version)
//  console.log('process.versions', process.versions)


//  require('./debug')

    cluster.setMaxListeners(0);
    process.setMaxListeners(0);

    const email = require('./module/email')();
    const Redis = require('ioredis');
    const redis = new Redis(global.ngivr.config.redis);

    await redis.set(global.ngivr.config.socketLockList, JSON.stringify([]));

    const stream = redis.scanStream({
        match: 'lock:*'
    });
    const pipeline = redis.pipeline();
    stream.on('data', function (keys) {
        // `keys` is an array of strings representing key names
        if (keys.length) {
            keys.forEach(function (key) {
                pipeline.del(key);
            });
        }
    });
    stream.on('end', async function () {
        try {
            await pipeline.exec();
            console.log('MASTER Redis zárak oldva.');
        } catch (e) {
            console.error(e)
        } finally {
            redis.disconnect();
        }
    });


    const forkWait = 250;
    const tooManyErrorsTimeout = 10000;
    const maxFailure = 5;

    const utils = require('corifeus-utils');
    const tooManyErrors = {}

    const ensureTooManyErrors = (cmd) => {
        if (!tooManyErrors.hasOwnProperty(cmd)) {
            tooManyErrors[cmd] = {
                count: 0,
                timeout: undefined,
            };
        }

    }

    const increaseTooManyErrors = async (cmd, message) => {
        tooManyErrors[cmd].count++;

        setTimeout(() => {
            tooManyErrors[cmd].count--;
        }, tooManyErrorsTimeout)

        console.log(cmd, message, tooManyErrors);

        if (tooManyErrors[cmd].count >= maxFailure || process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {

            if (process.env.NGIVR_ERROR_EMAIL !== undefined) {
                const body = `
On ${new Date().toLocaleString()}
<br/>
DIED WORKER PID: ${message.pid} CODE: ${message.code}, SIGNAL: ${message.signal}, ENV: ${cmd}
<br/>
The process is not going to start again. Too many failures: ${tooManyErrors[cmd].count}.
<br/>
The system is stopped.
<br/>
Debug:
<pre>
${JSON.stringify(tooManyErrors, null, 4)}
</pre>
`
                console.error('error email body', new Error(body))
                try {
                    await email.send({
                        subject: `NGIVR ${os.hostname()} ${process.env.NODE_ENV} process died: ${cmd} too many failures`,
                        body: body
                    })
                    console.error(body)
                } catch (e) {
                    console.error(`cannot send email`, e);
                }

            }
            process.exit(1);
        } else {
            fork({
                'NGIVR_SERVER_COMMAND': cmd
            })
        }

    }


    const messageHandler = async (msg) => {
        switch (msg.cmd) {
            case 'error':
                console.error('[master message]', msg)
                //ensureTooManyErrors(msg.NGIVR_SERVER_COMMAND)
                //increaseTooManyErrors(msg.NGIVR_SERVER_COMMAND, msg)
                break;
            default:
                console.log('[master message]', msg)
        }
        //process.exit();
    }

    const fork = async (env) => {
        await utils.timer.wait(forkWait);
        let newWorker = cluster.fork(env)
        newWorker.env = env;
        newWorker.on('message', messageHandler)
    }


    fork({
        'NGIVR_SERVER_COMMAND': 'singleton'
    })

    await utils.timer.wait(forkWait);

    while (Object.keys(cluster.workers).length < global.ngivr.config.workers + 1) {
        await fork({
            'NGIVR_SERVER_COMMAND': 'worker'
        })
    }

    cluster.on('exit', async (worker, code, signal) => {
        console.error(`DIED WORKER PID:${worker.process.pid} CODE: ${code}, SIGNAL: ${signal}, ENV: `, worker.env);

        if (process.env.NGIVR_ERROR_EMAIL !== undefined) {
            const body = `
On ${new Date().toLocaleString()}
<br/>
DIED WORKER PID: ${worker.process.pid} CODE: ${code}, SIGNAL: ${signal}, ENV: ${worker.env.NGIVR_SERVER_COMMAND}
<br/>
The process started again.
<br/>
Debug:
<pre>
${JSON.stringify(tooManyErrors, null, 4)}
</pre>

`;
            try {
                await email.send({
                    subject: `NGIVR ${process.env.NODE_ENV} process died: ${worker.env.NGIVR_SERVER_COMMAND}`,
                    body: body
                })
                console.error(body)
            } catch (e) {
                console.error('cannot send e-mail', e);
            }
        }
        ensureTooManyErrors(worker.env.NGIVR_SERVER_COMMAND);
        if (tooManyErrors.hasOwnProperty(worker.env.NGIVR_SERVER_COMMAND)) {
            increaseTooManyErrors(worker.env.NGIVR_SERVER_COMMAND, {
                cmd: 'error',
                'NGIVR_SERVER_COMMAND': worker.env.NGIVR_SERVER_COMMANDMMAND,
                pid: worker.process.pid,
                code: code,
                signal: signal,
            })

        }
    });
}


start();
