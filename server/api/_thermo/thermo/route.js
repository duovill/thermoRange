const express = require('express');

const router = express.Router();

router.get('/batch-video/:batchId', require('./action/batch-video'));
router.get('/measure/point-cloud/:equipmentMacId', require('./action/measure-point-cloud'))
router.get('/measure/point-cloud/check/:equipmentMacId', require('./action/measure-point-cloud-check'))

router.get('/measure/thermal/:equipmentMacId', require('./action/measure-thermal'))
router.get('/measure/thermal/check/:equipmentMacId', require('./action/measure-thermal-check'))


module.exports = router;
