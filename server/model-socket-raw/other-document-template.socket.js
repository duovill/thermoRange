const OtherDocumentTemplate = require('../schema/other-document-template');

module.exports.register = function(socket) {

    OtherDocumentTemplate.post('save', function (doc) {
        socket.emit('otherDocumentTemplate:save', doc);
    });
    OtherDocumentTemplate.post('remove', function (doc) {
        socket.emit('otherDocumentTemplate:remove', doc);
    });
};
