'use strict';
var mongoose = require('mongoose');
module.exports = mongoose.model('User', require('../../schema/user'));
