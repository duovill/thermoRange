const mongoose = require('mongoose')
const utils = require('corifeus-utils')
const lib = require('../lib')
const axios = require('axios')

const request = async(req, res) => {

    const clientLockName = lib.generateMeasureThermalLock(({
        macId: req.params.equipmentMacId
    }))
    const clientDoneThermalFunctionKey = lib.generateMeasureThermalComplete({
        macId: req.params.equipmentMacId
    })

    let robotThermalUrl
    try {
        const result = await global.ngivr.redis.setnx(clientLockName, 'measuring-pointcloud')
        if (result === 0) {
            res.json({
                info: 'measuring',
                status: 'ok',
            })
            return
        }
        await global.ngivr.redis.del(clientDoneThermalFunctionKey)
        const RobotModel = mongoose.model('MeasuringInstrument')
        const robot = await RobotModel.findOne({
            macId: req.params.equipmentMacId
        }).exec()
        robotThermalUrl = robot.thermalUrl
        console.log('robotThermalUrl', robotThermalUrl)

//        console.log('measure point cloud setnx', result, typeof result)
        res.json({
            info: 'started',
            status: 'ok',
        })


    } catch(e) {
        global.ngivr.handleError(res, e)
    }

    try {
        global.ngivr.socketio.emit('thermo-ngivr-measure-thermal-start', {
            macId: req.params.equipmentMacId
        })

        const response = await axios({
            method: 'post',
            url: robotThermalUrl,
            timeout: ngivr.config.robotTimeout
        })
        let ready = null

        let timeout
        let timeoutError = false
        timeout = setTimeout(() => {
            timeoutError = true
        }, ngivr.config.robotTimeout)
        do {
            await utils.timer.wait(1000)
            ready = await global.ngivr.redis.get(clientDoneThermalFunctionKey)
        } while(ready === null && timeoutError === false)
        clearTimeout(timeout)

        if (timeoutError === true) {
            throw new Error('Hőkamera mérés hiba')
        }

    } catch(e) {
//        global.ngivr.handleError(res, e)
        console.error(e)
        global.ngivr.socketio.emit('thermo-ngivr-measure-thermal-error', {
            macId: req.params.equipmentMacId,
            error: JSON.parse(JSON.stringify(e)),
        })
    } finally {
        await Promise.all([
            global.ngivr.redis.del(clientLockName),
            global.ngivr.redis.del(clientDoneThermalFunctionKey),
        ])
        global.ngivr.socketio.emit('thermo-ngivr-measure-thermal-complete', {
            macId: req.params.equipmentMacId
        })
    }
}

module.exports = request;
