'use strict';
ngivr.angular.factory('ngivrDataId', (ngivrDebounce, ngivrApi, socket) => {

  return class {

    constructor(options) {
      let {schema, id, $scope, preloaded, model, subscribe} = options;

      if ($scope === undefined) {
        const error = Error(`ngivr.data.id constructore requires a $scope option`)
        ngivr.growl.error(error);
        throw new error;
      }

      this.schema = schema;

      $scope.$on('$destroy', () => {
        ngivr.console.log(`NGIVR.DATA.ID SCOPE DESTORY`)
        this.destroy();
      });

      if (subscribe !== undefined) {
        const _subscribe = subscribe;
        subscribe = (promise) => {
          _subscribe(promise)
           ngivrDebounce.scope.digest($scope)
        }
      }

      this.events = {
        socket: socket.getEvents(schema)
      };
      this.listeners = {
        remove: (data) => {
          if (id === data._id) {
            model = undefined;
            $scope.ngModel = undefined;
            if (subscribe !== undefined) {
              const error = new Error(`${schema} deleted ${data._id}`);
              error.data = data;
              subscribe(Promise.reject(error));
            }
          }
        },
        save: (data) => {
          if (subscribe  !== undefined) {
            subscribe(Promise.resolve(data));
          }
          if (model !== undefined && model.hasOwnProperty('_id') && data._id === model._id) {
            ngivr.json.assign(model, data);
          }
          if ($scope.ngModel !== undefined && $scope.ngModel.hasOwnProperty('_id') && data._id === $scope.ngModel._id) {
            ngivr.json.assign($scope.ngModel, data);
          }
        }
      }

      if (model === undefined) {
        if (preloaded !== undefined) {
          this.promise = Promise.resolve(preloaded);
        } else {
          this.promise = ngivrApi.id(schema, id);
        }
      } else {
        this.promise = Promise.resolve(model);
      }

      socket.socket.on(this.events.socket.save, this.listeners.save);
      socket.socket.on(this.events.socket.remove, this.listeners.remove);

      if (subscribe !== undefined) {
        subscribe(this.promise);
      }
    }

    destroy() {
      if (this.destroyed === undefined ){
        this.destroyed = true;
        ngivr.console.log(`NGIVR.DATA.ID DESTROY ${this.schema}`);
        socket.socket.removeListener(this.events.socket.save, this.listeners.save);
        socket.socket.removeListener(this.events.socket.save, this.listeners.remove);
      }
    }
  }


});

