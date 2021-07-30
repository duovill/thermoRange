const lib = require('../lib')
const request = async(req, res) => {

    const clientLockName = lib.generateMeasureThermalLock(({
        macId: req.params.equipmentMacId
    }))

    try {
        const result = await global.ngivr.redis.get(clientLockName)
        console.log('check measure', clientLockName, result)
        res.send({
            status: 'ok',
            result: result,
        })
    } catch(e) {
        global.ngivr.handleError(res, e)
    }

}

module.exports = request;
