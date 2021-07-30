const express = require('express');
const router = express.Router();

router.post('/union/query/:schemas', require('./action/union'));
router.post('/:schema/query', require('./action/query'));
router.post('/:schema/save', require('./action/save'))
router.post('/:schema/insert-many', require('./action/insert-many'))

router.get('/:schema/schema', require('./action/schema'));

router.get('/:schema/last', require('./action/last'));
router.post('/:schema/last', require('./action/last'));
// simple design pattern factoried to use 1 file - for id, remove, disable
//
//                 id|remove|disable
router.get('/:schema/:simple/:id', require('./action/simple'));
router.post('/:schema/:simple/:id', require('./action/simple'));
//router.post('/:schema/id/:id', require('./action/remove'))
//router.post('/:schema/remove/:id', require('./action/remove'))
//router.post('/:schema/disable/:id', require('./action/disable'))

module.exports = router;
