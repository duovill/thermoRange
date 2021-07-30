const express = require('express');
const router = express.Router();
const callbackFn = require('./sendSms.controller').handleCallback;
//SeeMe SMS api callback endpoint
router.get('/',callbackFn)
module.exports = router;
