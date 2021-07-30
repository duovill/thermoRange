/**
 * Lehetővé teszi a directive-ek közti kommunikációt.
 * Használat:
 * Adat publikálása egyik directive-ben: $scope.publish('eventName', data);
 * Másik directive feliratkozva az eseményre: $scope.subscribe('eventName', (data) => { itt dolgozunk });
 */


'use strict';
ngivr.angular.service('ngivrPubSub', function () {


  return {Initialize:Initialize};

  function Initialize (scope) {
    //Keep a dictionary to store the events and its subscriptions
    const publishEventMap = {};

    //Register publish events
    scope.constructor.prototype.publish =  scope.constructor.prototype.publish
      || function () {
        const _thisScope = this;
        let handlers,
          args,
          evnt;
        //Get event and rest of the data
        args = [].slice.call(arguments);
        evnt = args.splice(0, 1);
        //Loop though each handlerMap and invoke the handler
        angular.forEach((publishEventMap[evnt] || []), function (handlerMap) {
          handlerMap.handler.apply(_thisScope, args);
        })
      };

    //Register Subscribe events
    scope.constructor.prototype.subscribe = scope.constructor.prototype.subscribe
      || function (evnt, handler) {
        const _thisScope = this,
          handlers = (publishEventMap[evnt] = publishEventMap[evnt] || []);

        //Just keep the scopeid for reference later for cleanup
        handlers.push({ $id: _thisScope.$id, handler: handler });
        //When scope is destroy remove the handlers that it has subscribed.
        _thisScope.$on('$destroy', function () {
          let i = 0;
          const l = handlers.length;
          for(; i<l; i++){
            if (handlers[i].$id === _thisScope.$id) {
              handlers.splice(i, 1);
              break;
            }
          }
        });
      }

  }
}).run(function ($rootScope, ngivrPubSub) {
  ngivrPubSub.Initialize($rootScope);
});
