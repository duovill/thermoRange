/**
 * Broadcast updates to client when the model changes
 */

'use strict';

const User = require('../../schema/user');

exports.register = function(socket) {
  User.post('save', function (doc) {
    onSave(socket, doc);
  });
  User.post('remove', function (doc) {
    onRemove(socket, doc);
  });
};

function onSave(socket, doc, cb) {
  socket.emit('user:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('user:remove', doc);
}
