/* jshint undef: true, unused: true, esversion: 6*/
'use strict';

let express = require('express');
let controller = require('./lock.controller');
let config = require('../../config/environment');
let auth = require('../../auth/auth.service');



let router = express.Router();

router.get('/', controller.index); //lockok listája
router.post('/', controller.create); //lock létrehozása
router.patch('/', controller.update); //lock meghosszabbítása
router.delete('/:resource/:user', controller.unlock); //lock törlése
router.post('/unlockMore', controller.unlockMore); //több lock törlése
router.post('/lockMore', controller.createMore); //több lock törlése


module.exports = router;
