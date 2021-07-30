const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ngivrSettings = require('../../client/shared/ngivr-settings');

const MeasuringInstrument = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        uniqueCaseInsensitive: true,
    },
    macId: {
        type: String,
        unique: true,
        required: true,
        validate: ngivrSettings.validation.macId.regex,
        uniqueCaseInsensitive: true,
    },
    pointCloudUrl: {
        type: String,
//        required: true,
        validate: ngivrSettings.validation.url.regex,
    },
    thermalUrl: {
        type: String,
//        required: true,
        validate: ngivrSettings.validation.url.regex,
    },
    pointMeasureUrl: {
        type: String,
//        required: true,
        validate: ngivrSettings.validation.url.regex,
    },

    /*
    deleted: {
        type: Boolean,
        default: false
    },
     */
});

MeasuringInstrument.index({name: 1}, {
//    unique: true,
});
MeasuringInstrument.index({macId: 1}, {
//    unique: true,
});

/*
MeasuringInstrument.index({deleted: 1}, {
});
 */

module.exports = MeasuringInstrument;
