const mz = require('mz');
const cluster = require('cluster');
const os = require('os');

module.exports = async (request, response) => {
    const base = process.cwd();


    const settings = {
        dynamic: false,
        'cluster': !cluster.isMaster,
        'workers': global.ngivr.config.workers,
    };
    if (await mz.fs.exists(base + '/.git')) {
        settings.dynamic = true;
        Object.assign(settings, require('../../../build'));
    } else {
        const readFile = (await mz.fs.readFile(
                base + '/settings.json', "utf-8")
        ).toString();

        Object.assign(settings, JSON.parse(
            readFile
        ));
    }
    response.status(201).json(settings);
}
