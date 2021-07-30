const mongoose = require('mongoose');

exports.RESPONSE_ACK                    = '0';
exports.RESPONSE_DEVICE_NOT_FOUND       = '1';

async function searchInstrumentByMacId(macId) {
    //let macIdFormatted = macId.split(':').join('');
    const measuringInstrument = mongoose.model('MeasuringInstrument')
    let instrument = await measuringInstrument.findOne({ 'macId': macId });
    return instrument;
}

function getResponse(event, message) {
    return {
        event: (event || ''),
        message: (message || exports.RESPONSE_ACK)
    };
}

exports.startThermoRangeBatch = async (macId) => {
    const thermoRangeBatch = mongoose.model('ThermoRangeBatch')
    let batch = new thermoRangeBatch({
        macId: macId,
        start: new Date()
    });

    await batch.save();
    return batch._id;
}

exports.stopThermoRangeBatch = async (batchId, frameCount) => {
    await thermoRangeBatch.findOneAndUpdate(
        {"_id": mongoose.Types.ObjectId(batchId) },
        {
            "$set": {
                "end": new Date(),
                "frameCount": frameCount
            }
        }
    );
}

exports.saveThermoRangeBatchFrame = async (data, macId) => {
    let rawBuff = new Buffer(data.raw, 'base64');
    const thermoRangeBatchFrames = mongoose.model('ThermoRangeBatchFrames')
    let raw = new thermoRangeBatchFrames({
        batchId: data.batchId,
        macId: macId,
        frameIndex: data.imageIndex,
        type: 'raw',
        data: rawBuff
    });

    let jpegBuff = new Buffer(data.jpeg, 'base64');
    let jpeg = new thermoRangeBatchFrames({
        batchId: data.batchId,
        macId: macId,
        frameIndex: data.imageIndex,
        type: 'jpeg',
        data: jpegBuff
    });

    await Promise.all([
        raw.save(),
        jpeg.save(),
    ])
}

exports.thermalImageReceived = async (socket, data) => {
    let response = getResponse();
    try {

        let macId=(socket.handshake.query.robotId || '');
        let instrument = await searchInstrumentByMacId(macId);
        if (instrument) {
            console.log('Running batch: ' + data.batchId + ', imageIndex: ' + data.imageIndex);
            if (data.imageIndex > 300) {
                response = getResponse('stop_thermal_image', '');
                await exports.stopThermoRangeBatch(data.batchId, data.imageIndex);
                //FIXME: Finish thermal capture stop by sending a global emit event
                const lib = require('../../thermo/lib')
                await global.ngivr.redis.set(lib.generateMeasureThermalComplete({
                    macId: macId
                }), '0')
            }
            else {
                console.log("--- Saving frames: " + data.imageIndex);
                await exports.saveThermoRangeBatchFrame(data, macId);
            }
        }
        else {
            response = getResponse('server_error', exports.RESPONSE_DEVICE_NOT_FOUND);
        }
    }
    catch (e) {
        console.error(e);
        response.event = 'server_error';
        response.message = e;
    }
    finally {
        return response;
    }
}

exports.ping = async (socket, data) => {
    let response = getResponse();
    try {

        let macId=(socket.handshake.query.robotId || '');
        let instrument = await searchInstrumentByMacId(macId);
        if (instrument) {
            console.log('Requesting video stream!');
            let batchId = await exports.startThermoRangeBatch(macId);
            response = getResponse('start_thermal_image', batchId);
        }
        else {
            response = getResponse('server_error', exports.RESPONSE_DEVICE_NOT_FOUND);
        }
    }
    catch (e) {
        console.error(e);
        response = getResponse('server_error', e);
    }
    finally {
        return response;
    }
}
