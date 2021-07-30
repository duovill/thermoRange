'use strict';

var express = require('express');
var controller = require('./mailer.controller');

var router = express.Router();

//Provide a mail sender intarface
router.get('/send', controller.send);

module.exports = router;
