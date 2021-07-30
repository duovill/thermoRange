'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

const settings = require('../../../client/shared/ngivr-settings');

router.get('/', auth.hasRole(settings.user.role.adminGlobal), controller.index);
router.delete('/:id', auth.hasRole(settings.user.role.adminGlobal), controller.destroy);
router.get('/me', controller.me);
router.put('/:id', auth.hasRole(settings.user.role.adminGlobal), controller.update);
router.put('/:id/password', controller.changePassword);
router.put('/:id/quickNavLinks', controller.changequickNavLinks);
router.get('/:id', controller.show);
router.post('/', controller.create);

module.exports = router;
