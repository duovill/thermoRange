const utils = require('corifeus-utils');
global.ngivr.queue('test', async(job) => {
  const redis = global.ngivr.redis;
  const key = 'queue-test';

  // it adhatsz adatot as felhasznalni, funkciok nem, csak adat!!!!
  console.log(job.data);

  if (!await redis.exists(key)) {
    redis.set(key, 0);
  }
  await utils.timer.wait(1000);
  await redis.incr(key)
  const count = await redis.get(key);
  console.log('test queue count', count);
})
