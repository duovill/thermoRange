const express = require('express');
const router = express.Router();

router.get('/settings', require('./action/settings'));
router.get('/weighing-house', require('./action/weighing-house'));

if (process.env.NODE_ENV === 'development') {
    router.get('/queue-lock', require('./action/queue-lock'));
    router.get('/error', require('./action/error'));
    router.get('/date', require('./action/date'));
    router.get('/slow', require('./action/slow'));
    router.get('/401', require('./action/401'));
    router.get('/error-handler', require('./action/error-handler'));
}

module.exports = router;
