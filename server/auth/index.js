'use strict';

var express = require('express');
var passport = require('passport');
var config = require('../config/environment');
var User = require('../api/user/user.model');
var auth = require('../auth/auth.service');

// Passport Configuration
require('./local/passport').setup(User, config);

var router = express.Router();

router.use('/local', require('./local'));

router.get('/prolongate', function(req, res){
  var token = auth.signToken(req.user._id, req.user.role);
  return res.status(200).json({token: token});
});

module.exports = router;

let syncRouter = require('./remote')
module.exports.sync = syncRouter
