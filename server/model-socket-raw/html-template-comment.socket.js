/**
 * Broadcast updates to client when the model changes
 */

'use strict';

const HtmlTemplateComment = require('../schema/html-template-comment');

module.exports.register = function(socket) {

  HtmlTemplateComment.post('save', function (doc) {
    onSave(socket, doc);
  });
  HtmlTemplateComment.post('remove', function (doc) {
    onRemove(socket, doc);
  });
};

function onSave(socket, doc, cb) {
  socket.emit('htmlTemplateComment:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('htmlTemplateComment:remove', doc);
}
