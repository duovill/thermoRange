'use strict';
ngivr.event = class {

  static emit($scope, event, args) {
    ngivr.console.group(`NGIVR.EVENT.EMIT: ${event}`);
    ngivr.console.log(args);
    $scope.$emit(event, args);
    ngivr.console.group();
  }

  static broadcast($scope, event, args) {
    ngivr.console.group(`NGIVR.EVENT.BROADCAST: ${event}`);
    ngivr.console.log(args);
    $scope.$broadcast(event, args);
    ngivr.console.group();
  }

  static onDefault($scope, eventName, cb) {
    ngivr.console.group(`NGIVR.EVENT.ON: ${eventName}`);
    ngivr.console.log(cb);
    $scope.$on(eventName, cb);
    ngivr.console.group();
  }

  static get on() {
    return {
      form: {
        enabled: ($scope, cb ) => {
          this.onDefault($scope, ngivr.settings.event.client.form.enabled, cb)
        },
        lockChange: ($scope, cb ) => {
          this.onDefault($scope, ngivr.settings.event.client.form.lockChange, cb)
        },
        loaded: ($scope, cb ) => {
          this.onDefault($scope, ngivr.settings.event.client.form.loaded, cb)
        },
      },
      list: {
        clear: ($scope, cb) => {
          this.onDefault($scope, ngivr.settings.event.client.list.clear, cb)
        },
        loaded: ($scope, cb) => {
          this.onDefault($scope, ngivr.settings.event.client.list.loaded, cb)
        }
      }
    }
  }
};
