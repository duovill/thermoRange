const mongoose = require('mongoose')
const utils = require('corifeus-utils')
const lib = require('../lib')
const axios = require('axios')

const request = async(req, res) => {

    const clientLockName = lib.generateMeasurePointCloudLock(({
        macId: req.params.equipmentMacId
    }))

    let robotPointCloudUrl
    try {
        const result = await global.ngivr.redis.setnx(clientLockName, 'measuring-pointcloud')
        if (result === 0) {
            res.json({
                info: 'measuring',
                status: 'ok',
            })
            return
        }
        const RobotModel = mongoose.model('MeasuringInstrument')
        const robot = await RobotModel.findOne({
            macId: req.params.equipmentMacId
        }).exec()
        robotPointCloudUrl = robot.pointCloudUrl
        console.log('robotPointCloudUrl', robotPointCloudUrl)

//        console.log('measure point cloud setnx', result, typeof result)
        res.json({
            info: 'started',
            status: 'ok',
        })


    } catch(e) {
        global.ngivr.handleError(res, e)
    }

    try {
        global.ngivr.socketio.emit('thermo-ngivr-measure-start', {
            macId: req.params.equipmentMacId
        })
        const ThermoRangeBatchPointCloudModel = mongoose.model('ThermoRangeBatchPointCloud');
        //console.log('req.params.equipmentMacId', req.params.equipmentMacId)
        const model = {
            macId: req.params.equipmentMacId,
            startedAt: new Date(),
            completeAt: undefined,
            cloudPoints: require('./measure-point-cloud-test.json'),
        }
        await utils.timer.wait(10000)

        const response = await axios({
            method: 'post',
            url: robotPointCloudUrl,
            timeout: ngivr.config.robotTimeout
        })
        model.cloudPoints = response.data.points

        model.completeAt = new Date()
        const pointCloudInstance = new ThermoRangeBatchPointCloudModel(model)
        await pointCloudInstance.save()


    } catch(e) {
//        global.ngivr.handleError(res, e)
        console.error(e)
        global.ngivr.socketio.emit('thermo-ngivr-measure-error', {
            macId: req.params.equipmentMacId,
            error: JSON.parse(JSON.stringify(e)),
        })
    } finally {
        await global.ngivr.redis.del(clientLockName)
        global.ngivr.socketio.emit('thermo-ngivr-measure-complete', {
            macId: req.params.equipmentMacId
        })
    }
}

module.exports = request;
