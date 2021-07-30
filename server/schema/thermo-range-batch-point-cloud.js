const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ngivrSettings = require('../../client/shared/ngivr-settings');

const ThermoRangeBatchPointCloud = new Schema({
    macId: {
        type: String,
        required: true,
        validate: ngivrSettings.validation.macId.regex,
        uniqueCaseInsensitive: true,
    },
    cloudPoints: [],
    startedAt: Date,
    completeAt: Date,
    volume: Number,
});

ThermoRangeBatchPointCloud.index({batchId: 1}, {
//    unique: true,
});

ThermoRangeBatchPointCloud.index({macId: 1}, {
//    unique: true,
});

ThermoRangeBatchPointCloud.index({completeAt: 1}, {
//    unique: true,
});

ThermoRangeBatchPointCloud.index({startedAt: 1}, {
//    unique: true,
});

module.exports = ThermoRangeBatchPointCloud;
