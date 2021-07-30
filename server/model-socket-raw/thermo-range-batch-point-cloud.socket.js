const ThermoRangeBatchPointCloud = require('../schema/thermo-range-batch-point-cloud')

module.exports.register = function(socket) {

    ThermoRangeBatchPointCloud.post('save', function (doc) {
        onSave(socket, doc);
    });
    ThermoRangeBatchPointCloud.post('remove', function (doc) {
        onRemove(socket, doc);
    });
};

function onSave(socket, doc, cb) {
    socket.emit('thermoRangeBatchPointCloud:save', doc);
}

function onRemove(socket, doc, cb) {
    socket.emit('thermoRangeBatchPointCloud:remove', doc);
}
