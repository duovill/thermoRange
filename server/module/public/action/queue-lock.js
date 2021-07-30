const utils = require('corifeus-utils');
module.exports = async (request, response) => {

    try {
        const settings = await global.ngivr.queue.lock({
            name: 'test',
            request: request,
            response: response,
            exec: async () => {
                const time = new Date().toLocaleString()
                const now = Date.now();
                const redisKey = 'queue-lock-test';
//        await utils.timer.wait(Math.random() >= 0.5 ? 1000 : global.ngivr.config.queue.lock.timeout + 10000);
                await utils.timer.wait(1000);

                const redis = global.ngivr.redis;
                if (!redis.exists(redisKey)) {
                    await redis.set(redisKey, 0);
                }
                await redis.incr(redisKey);
                const counter = await redis.get(redisKey);
                console.log();
                console.log('Queue lock date test', time, `settings: ${settings.requestId}`, 'counter', counter);
                console.log();

                response.json({
                    time: time,
                    timestamp: now,
                })
            }
        });

    } catch(e) {
        global.ngivr.handleError(res, e)
    }
}
