'use strict';

var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var _ = require('lodash');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = async function (req, res, next) {
  var newUser = new User(req.body);
  await newUser.setPassword(req.body.password);
  newUser.provider = 'local';
  //newUser.role = 'user';
  newUser.save(function(err, user) {
//    console.log(arguments);
    if (err) return validationError(res, err);
    var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresIn: config.settings.session.timeLengthMinutes * 60 }); //módosítás előtt: expiresInMinutes: 60*5
    res.json({ token: token });
  });
};

/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if(err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, async function (err, user) {
    const auth = await user.authenticate(oldPass)
    if(auth) {
      try {
        await user.setPassword(newPass);
        user.save(function(err) {
          if (err) return validationError(res, err);
          res.status(200).send('OK');
        });
      } catch (error) {
        res.status(options.status || 500).send({
          result: options.result || 'error',
          message: error.message,
        });
      }
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Change a users quickNavLinks
 */
exports.changequickNavLinks = function(req, res, next) {
  var userId = req.user._id;
  var quickNavLinks = req.body.quickNavLinks;
  console.log(quickNavLinks);

  User.findById(userId, function (err, user) {
      if(err) { global.ngivr.handleError(res, err); }
      if(!user) { return res.status(404).send('Not Found'); }
      user.quickNavLinks = quickNavLinks;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
  });
};

/**
 * Update user
 */
exports.update = function(req, res, next) {


  User.findById(req.params.id,  async function (err, user) {
    if(err) { global.ngivr.handleError(res, err); }
    if(!user) { return res.status(404).send('Not Found'); }
    try {
      if (req.body.password)  await user.setPassword(req.body.password);
      var updated = _.merge(user, req.body);

      updated.save(function (err) {
        if(err) { global.ngivr.handleError(res, err); }
        return res.status(200).json(user);
      });
    } catch (error) {
      res.status(options.status || 500).send({
        result: options.result || 'error',
        message: error.message,
      });
    }

    /*if(err) { global.ngivr.handleError(res, err); }
    if(!user) { return res.status(404).send('Not Found'); }
    var updated = _.extend(user, req.body);
    updated.save(function (err) {
      if(err) { global.ngivr.handleError(res, err); }
      return res.status(200).json(user);
    });*/
  });
};

/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

