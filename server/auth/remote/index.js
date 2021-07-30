/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/* global module,require,console,app,exports */
'use strict';

var express = require('express');
let syncRouter = express.Router();
let authMiddleware= require("./remote.auth")();
syncRouter.use(authMiddleware.auth);
// syncRouter.get('/',(req,res)=>{return res.send('AKOMBAKONM')});
module.exports = syncRouter
