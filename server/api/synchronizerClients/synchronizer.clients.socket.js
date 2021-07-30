/**
 * Broadcast updates to the client(s) by socket and to the server(s) by REDIS when the model changes
 */

'use strict';

const SynchronizerClients = require('../../schema/synchronizerClients');
let redisPubSub = require('../../module/redis-pub-sub/redis-pub-sub.js')();
let syncConf=require('../../config/master.slave');

exports.register = function(socket) {
  SynchronizerClients.post('save', function (doc) {
    onSave(socket, doc);
  });
  SynchronizerClients.post('remove', function (doc) {
    onRemove(socket, doc);
  });
};

function onSave(socket, doc, cb) {
  //frissíti a memóriabeli sync adatokat
  syncConf.refreshData();
  socket.emit('synchronizerClient:save', doc);
  redisPubSub.publish("changes:synchronizer",'SYNC data changed')
}

function onRemove(socket, doc, cb) {
  syncConf.refreshData();
  socket.emit('synchronizerClient:remove', doc);
  redisPubSub.publish("changes:synchronizer",'SYNC data changed')
}
