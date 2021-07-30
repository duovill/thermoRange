
const generateMeasurePointCloudLock = ({ macId }) => {
    return `lock:thermo-robot-measuring-lock:${macId.replace(/:/g, '-')}`
}

const generateMeasureThermalLock = ({ macId }) => {
    return `lock:thermo-robot-measuring-thermal-lock:${macId.replace(/:/g, '-')}`
}

const generateMeasureThermalComplete = ({ macId }) => {
    return `complete:thermo-robot-measuring-thermal:${macId.replace(/:/g, '-')}`
}

module.exports.generateMeasureThermalLock = generateMeasureThermalLock
module.exports.generateMeasurePointCloudLock = generateMeasurePointCloudLock
module.exports.generateMeasureThermalComplete = generateMeasureThermalComplete
