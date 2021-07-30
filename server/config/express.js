/**
 * Express configuration
 */

'use strict';

const express = require('express');
const favicon = require('serve-favicon');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./environment');
const passport = require('passport');

const auth = require('../auth/auth.service');

module.exports = function (app) {

    if (process.env.NODE_ENV === 'development') {
        const cors = require('cors');
        app.use(cors());
    }
    app.enable('etag')
    app.use(bodyParser.urlencoded({
        extended: false,
        limit: '128mb'
    }));
    app.use(bodyParser.json({
        limit: '128mb',
    }));
    app.use(cookieParser());
    app.use(passport.initialize());

    app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', path.join(config.root, 'client'));

    var json2xls = require('json2xls');
    app.use(json2xls.middleware)

    app.all("/auth/prolongate", auth.isAuthenticated());
    app.all("/api/*", auth.isAuthenticated());
    app.all("/data/*", auth.isAuthenticated());

    //TODO bull
    app.all("/arena/*", auth.isAuthenticated());

    if (global.ngivr.config.silent === false) {
        app.use((req, res, next) => {
            let body = '';
            if (!req.originalUrl === '/auth/local') {
                body =`
BODY: ${JSON.stringify(req.body)}`
            }
            console.log(`[HTTP] ${res.statusCode} ${req.method} ${req.originalUrl}${body}`);
            next();
        });
    }

    app.use((err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
            res.status(401).json({
                status: 'error',
                message: err.message,
                name: err.name,
            })
        } else {
            console.error(err);
            next(err);
        }
    });


};
