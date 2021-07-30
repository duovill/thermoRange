const OtherDocument = require('../schema/other-document');

module.exports.register = function(socket) {

    OtherDocument.post('save', function (doc) {
        socket.emit('otherDocument:save', doc);
    });
    OtherDocument.post('remove', function (doc) {
        socket.emit('otherDocument:remove', doc);
    });
};
