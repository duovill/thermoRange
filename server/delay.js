const utils = require('corifeus-utils');

const start = async () => {
  await utils.timer.waitFile();
}
start()
