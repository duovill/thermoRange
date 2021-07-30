const express = require('express');

const router = express.Router();

const templateInstanceRouterGenerator = require('./action/template-instance').generater

templateInstanceRouterGenerator(router);

module.exports = router;
