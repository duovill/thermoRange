/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports,ngivr */
'use strict';

let express = require('express');

let router = express.Router();
let synchronizer = require('./synchronizer.master.controller');
router.get('/', function(req,res){synchronizer.pong(req,res)});
router.post('/pull/:schema', function(req,res){synchronizer.pull(req,res)});
router.post('/push', function(req,res){synchronizer.push(req,res)});
module.exports = router;
