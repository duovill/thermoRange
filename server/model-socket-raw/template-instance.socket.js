/**
 * Broadcast updates to client when the model changes
 */

'use strict';

const TemplateInstance = require('../schema/template-instance');

module.exports.register = function(socket) {

  TemplateInstance.post('save', function (doc) {
    onSave(socket, doc);
  });
  TemplateInstance.post('remove', function (doc) {
    onRemove(socket, doc);
  });
};

function onSave(socket, doc, cb) {
  socket.emit('templateInstance:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('templateInstance:remove', doc);
}
