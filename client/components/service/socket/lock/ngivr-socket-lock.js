const protocol = ngivr.strings.protocol;

ngivr.angular.factory('ngivrSocketLock', function (socket, ngivrService, Auth, $timeout) {

  const ngivrSocketService = {
    socketLockList: [],
    clientId: "",
    user: null,
    locker: null,
    run: function () {
      ngivr.console.log(ngivr.settings.socket.event.lock.run);
      ngivrService.socketService = ngivrSocketService;
    },
    get: function () {
      socket.socket.emit(ngivr.settings.socket.event.lock.list.get);
    },
    add: function (data) {

      if (this.check(data))
      {
        return;
      }

      if (data.model._id === undefined)
      {
        return;
      }

      const that = this;
      data.user = this.getUser();
      data.event = ngivr.settings.socket.event.lock.add;
      socket.socket.emit(ngivr.settings.socket.event.lock.add, protocol.wrap(data));
      ngivrSocketService.socketLockList.push(protocol.wrap(data));
      $timeout(function() {
        that.get();
      }, 500);
    },
    connect: function () {
      socket.socket.emit(ngivr.settings.socket.event.lock.connect);
      socket.socket.emit(ngivr.settings.socket.event.lock.update);
    },
    remove: function (data) {
      const that = this;
      data.event = ngivr.settings.socket.event.lock.remove;
      socket.socket.emit(ngivr.settings.socket.event.lock.remove, protocol.wrap(data));
      $timeout(function() {
        that.get();
      }, 500);
    },
    removeAll: function () {
      socket.socket.emit(ngivr.settings.socket.event.lock.removeall);
    },
    check: function (data) {
      for (let i in this.socketLockList) {

          if (this.socketLockList[i].data.model._id === data.model._id
          && this.socketLockList[i].data.schema === data.schema)
          {
            return true;
          }

      }
      return false;
    },
    destory: function (data) {
      this.remove(data);
    },
/*    factory: function (data) {
        // model: $scope.ngModel,
        // locked: $scope.locked,
        // schema: $scope.ngivrSchema
        // change: Function callback for UI
        data.service = this;

      return new ngivr.socket.lock.instance(data);
    },*/
    // changeArray: Function,
    getUser: function () {

      if (this.user === null)
      {
        this.user = Auth.getCurrentUser();
      }

      return this.user;
    },
    getLocker: function (data) {
      for (let i in this.socketLockList) {
        if (
          //this.socketLockList[i].clientId != this.clientId
          // &&
          //(this.socketLockList[i].data.formName == data.formName || this.socketLockList[i].clientId != this.clientId)
          // &&
          this.socketLockList[i].data.model._id === data.data.model._id
          && this.socketLockList[i].data.schema === data.data.schema)
        {
          return this.socketLockList[i].data.user;
        }
      }
      return null;
    }
  };

  socket.socket.on(ngivr.settings.socket.event.lock.list.update, function (data) {
    ngivrSocketService.socketLockList = data.data;
    ngivr.console.log(ngivr.settings.socket.event.lock.list.update + ": " + data.data.length);
  });

  socket.socket.on(ngivr.settings.socket.event.lock.init, function (data) {
    ngivrSocketService.socketLockList = data.data.socketLockList;
    ngivrSocketService.clientId = data.data.clientId;
    ngivr.console.log(ngivr.settings.socket.event.lock.init + ": " + data.data.clientId);
    // socket.socket.emit(ngivr.settings.socket.event.lock.list.get);
  });

  ngivrSocketService.connect();

  return ngivrSocketService;
});
