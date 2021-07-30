'use strict';

const mongoose = require('mongoose');
const passport = require('passport');
const config = require('../config/environment');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const compose = require('composable-middleware');
const User = require('../api/user/user.model');
const validateJwt = expressJwt({ secret: config.secrets.session });
const _ = require('lodash');

const settings = require('../../client/shared/ngivr-settings');

const url = require('url'); // built-in utility

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
    // Validate jwt
    .use(function(req, res, next) {

        if (req.query.hasOwnProperty('token') &&  req.query.token === global.ngivr.config.robotToken) {
            req.user = {
                _id: 'robot'
            }
            return next();
        }

      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      else if (
        !req.headers.hasOwnProperty('authorization') &&
        _.hasIn(req, 'cookies.token') &&
        req.cookies.token !== undefined &&
        req.cookies.token.length > 3 &&
        url.parse(req.url).pathname !== '/auth/local'
      ) {
          req.headers.authorization = 'Bearer ' + req.cookies.token;
      }
      //console.log(req.headers.authorization)
      //console.log('Bearer ' + req.cookies.token.substring(1, req.cookies.token.length -1 ))
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use(function(req, res, next) {
      if (req.user._id === 'robot') {
          return next();
      }
      User.findById(req.user._id, function (err, user) {
        if (err) return next(err);
        if (!user) return res.status(401).send('Unauthorized');

        req.user = user;
        next();
      });
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (settings.user.role.order[req.user.role] >= settings.user.role.order[roleRequired]) {
        next();
      }
      else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
function signToken(id) {
  return jwt.sign({ _id: id }, config.secrets.session, { expiresIn: config.settings.session.timeLengthMinutes * 60 }); //módosítás előtt: expiresInMinutes: 60*5
}

/**
 * Set token cookie directly for oAuth strategies
 */
function setTokenCookie(req, res) {
  if (!req.user) return res.status(404).json({ message: 'Something went wrong, please try again.'});
  const token = signToken(req.user._id, req.user.role);
  res.cookie('token', JSON.stringify(token));
  res.redirect('/');
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.setTokenCookie = setTokenCookie;
