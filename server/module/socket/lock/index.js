/**
 * Created by Kovács Marcell on 2017.02.09..
 */

const protocol = require('../../../../client/shared/ngivr-protocol');
const settings = require('../../../../client/shared/ngivr-settings');
//const socketLockList = [];

const cluster = require('cluster');

module.exports = async function (socket) {

  /********************************
   *
   * AZ NAGYON FONTOS HOGY A socketLockList
   * AZ A MASTER-BAN van az inicializálása.
   * server/master.js, mashogy nem mukodik.
   *
   ********************************/

  const redis = global.ngivr.redis;

  if (cluster.isMaster) {
    await redis.set(global.ngivr.config.socketLockList , JSON.stringify([]));
  }

  const getSocketLockList = async () => {
    const jsonSocketLockList = await redis.get(global.ngivr.config.socketLockList);
    return JSON.parse(jsonSocketLockList);
  }

  const setSocketLockList = async (socketLockList) => {
    const jsonSocketLockList = JSON.stringify(socketLockList);
    await redis.set(global.ngivr.config.socketLockList, jsonSocketLockList);
  }


  class socketLock {
    constructor(client, data) {
      this.clientId = client;
      this.data = data;
    }
  }

  function createSocketLock(client, data) {
    return new socketLock(client, data);
  }

  const onConnectSocketLock = async (socket) => {
    const socketLockList = await getSocketLockList()
    console.log('SOCKET LOCK Connected:' + socket.address);
    socket.emit(settings.socket.event.lock.init, protocol.wrap({ clientId: socket.id , socketLockList: socketLockList }));
  }

  const onAddSocketLock = async (socket, data) => {
    const socketLockList = await getSocketLockList()
    console.log("onAddSocketLock: " + socket.id + ", " + JSON.stringify(data.data));
    const _socketLock = new socketLock(socket.id, data.data);
    socketLockList.push(_socketLock);
    await setSocketLockList(socketLockList)
    socket.broadcast.emit(settings.socket.event.lock.list.update, protocol.wrap(socketLockList));
    // socket.emit(settings.socket.event.lock.list.ownlist, protocol.wrap({list: socketLockList, model: data}));
  }

  const onRemoveSocketLock = async (socket, data) => {
    const socketLockList = await getSocketLockList()
    console.log("onRemoveSocketLock: " + socket.id + ", " + JSON.stringify(data.data));
    if (data.data.model === null) return;
    let remove = false;
    for (i = 0; i < socketLockList.length; i++) {
      // console.log("onRemoveSocketLock: " + socketLockList[i].data.formName == data.data.formName + ", " + JSON.stringify(data.data));
      // console.log("onRemoveSocketLock: " + socketLockList[i].clientId == socket.id);
      // console.log("onRemoveSocketLock: " + socketLockList[i].data.model._id == data.data.model._id);
      // console.log("onRemoveSocketLock: " + socketLockList[i].data.schema == data.data.schema);
      if (
        //socketLockList[i].clientId == socket.id
        //&&
        (socketLockList[i].data.formName === data.data.formName
          && socketLockList[i].clientId === socket.id)
          && socketLockList[i].data.model._id === data.data.model._id
          && socketLockList[i].data.schema === data.data.schema)
      {
        socketLockList.splice(i, 1);
        remove = true;
      }
    }
    await setSocketLockList(socketLockList)

    if (remove) {
      socket.broadcast.emit(settings.socket.event.lock.list.update, protocol.wrap(socketLockList));
      // socket.emit(settings.socket.event.lock.list.update, protocol.wrap(socketLockList));
      console.log("onRemoveSocketLock: " + socket.id + ", " + socketLockList.length);
    }
  }

  const onGetSocketLockList = async (socket) => {
    const socketLockList = await getSocketLockList()
    console.log("onGetSocketLockList: " + socket.id);
    socket.emit(settings.socket.event.lock.list.update, protocol.wrap(socketLockList));
  }

  const onRemoveAllSocketLock = async (socket) => {
    const socketLockList = await getSocketLockList()
    console.log('SOCKET LOCK RemoveAll:' + socket.address);
    let remove = false;
    for (i = 0; i < socketLockList.length; i++) {
      if (socketLockList[i].clientId === socket.id)
      {
        socketLockList.splice(i, 1);
        remove = true;
      }
    }
    await setSocketLockList(socketLockList)

    if (remove) {
      socket.broadcast.emit(settings.socket.event.lock.list.update, protocol.wrap(socketLockList));
    }
  }

  const onDisconnectSocketLock = async (socket) => {
    const socketLockList = await getSocketLockList()
    console.log('SOCKET LOCK DISCONNECTED ' + socket.address);
    let remove = false;
    for (i = 0; i < socketLockList.length; i++) {
      if (socketLockList[i].clientId === socket.id)
      {
        socketLockList.splice(i, 1);
        remove = true;
      }
    }
    await setSocketLockList(socketLockList)

    if (remove) {
      socket.broadcast.emit(settings.socket.event.lock.list.update, protocol.wrap(socketLockList));
    }
  }

  socket.on(settings.socket.event.lock.connect, async () => {
    await onConnectSocketLock(socket);
  });

  socket.on(settings.socket.event.lock.add, async (data) => {
    await onAddSocketLock(socket, data);
  });

  socket.on(settings.socket.event.lock.list.get, async () => {
    await onGetSocketLockList(socket);
  });

  socket.on(settings.socket.event.lock.remove, async (data) => {
    await onRemoveSocketLock(socket, data);
  });

  socket.on(settings.socket.event.lock.removeall, async () => {
    await onRemoveAllSocketLock(socket);
  });

  socket.on('disconnect', async () => {
    await onDisconnectSocketLock(socket);
  });
}
