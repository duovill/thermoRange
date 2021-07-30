/**
 * Main application routes
 */

'use strict';

const path = require('path');
const fs = require('mz/fs');

module.exports = function (app) {

    // MODULE
    app.use('/data', require('./module/data/route'));
    app.use('/public', require('./module/public/route'));
    require('./module/queue/arena').init(app);

    // API
    app.use('/api/users', require('./api/user'));
    app.use('/api/lock', require('./api/lock'));
    app.use('/api/queue', require('./api/queue'));
    app.use('/api/thermo', require('./api/_thermo/thermo/route'));
    app.use('/auth', require('./auth'));
    app.use('/sync', require('./auth').sync);
    app.use('/sync', require('./module/synchronizerMaster/index'));


    // here comes the routes associated with the server to server sync
    // all of these routes uses token authentication with the token sent in the header
    // app.use('/sync/akarmi',(req,res)=>{res.status(200).send('RENDBEN')})

    // All undefined asset or api routes should return a 404
    app.route('/:url(api|fonts|auth|components|app|bower_components|assets|arena)/*')
        .get(async (req, res) => {
            const missingFile = path.resolve(app.get('appPath') + '/error/404.html');
            if (process.cwd().endsWith('dist') && !await fs.exists(missingFile)) {
                res.sendFile(path.resolve(`${process.cwd()}/../client/error/50x.html`));
                return;
            }
            res.sendFile(missingFile);
        });

    // All other routes should redirect to the index.html
    app.route('/*')
        .get(async (req, res) => {
            const indexFile = path.resolve(app.get('appPath') + '/index.html');
            if (process.cwd().endsWith('dist') && !await fs.exists(indexFile)) {
                res.sendFile(path.resolve(`${process.cwd()}/../client/error/50x.html`));
                return;
            }
            res.sendFile(indexFile);
        });
};
