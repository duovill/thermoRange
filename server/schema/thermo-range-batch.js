const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ngivrSettings = require('../../client/shared/ngivr-settings');

const ThermoRangeBatch = new Schema({
    macId: {
        type: String,
        required: true,
        validate: ngivrSettings.validation.macId.regex,
        uniqueCaseInsensitive: true,
    },
    
    start: Date,
    end: Date,
    frameCount: Number
});

ThermoRangeBatch.index({macId: 1}, {
//    unique: true,
});

ThermoRangeBatch.index({start: 1}, {
//    unique: true,
});

ThermoRangeBatch.index({end: 1}, {
//    unique: true,
});

module.exports = ThermoRangeBatch;
