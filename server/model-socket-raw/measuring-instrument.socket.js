const MeasuringInstrument = require('../schema/measuring-instruments')

module.exports.register = function(socket) {

    MeasuringInstrument.post('save', function (doc) {
        onSave(socket, doc);
    });
    MeasuringInstrument.post('remove', function (doc) {
        onRemove(socket, doc);
    });
};

function onSave(socket, doc, cb) {
    socket.emit('measuringInstrument:save', doc);
}

function onRemove(socket, doc, cb) {
    socket.emit('measuringInstrument:remove', doc);
}

