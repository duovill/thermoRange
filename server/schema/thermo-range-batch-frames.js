const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ngivrSettings = require('../../client/shared/ngivr-settings');

const ThermoRangeBatchFrames = new Schema({
    batchId: {
        type: Schema.Types.ObjectId,
        ref: 'ThermoRangeBatch'
    },
    macId: {
        type: String,
        required: true,
        validate: ngivrSettings.validation.macId.regex,
        uniqueCaseInsensitive: true,
    },
    type: {
        type: String,
        enum: ['jpeg', 'raw'],
        default: 'jpeg'
    },

    frameIndex: Number,

    data: Buffer
});

ThermoRangeBatchFrames.index({batchId: 1}, {
//    unique: true,
});
ThermoRangeBatchFrames.index({macId: 1}, {
//    unique: true,
});

ThermoRangeBatchFrames.index({type: 1}, {
//    unique: true,
});

ThermoRangeBatchFrames.index({frameIndex: 1}, {
//    unique: true,
});

module.exports = ThermoRangeBatchFrames;
