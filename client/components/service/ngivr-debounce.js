'use strict';
ngivr.angular.factory('ngivrDebounce', function($timeout) {

    const scopeTimeout = {
        digest: {},
        apply: {},
    }

    const factory = function() {
      this.scope = new function() {
          const handler = (timeoutTable, scope, key, fun) => {
              if (scope && !scope.$$destroyed) {
                  $timeout.cancel(timeoutTable[scope.$id])
                  timeoutTable[scope.$id] = $timeout(() => {
                      scope[key](fun)
                      delete timeoutTable[scope.$id];
                  }, 10)
              }
          }

          this.digest = (scope) => {
              handler(scopeTimeout.digest, scope, '$digest')
          }

          this.apply = (scope, fun) => {
              handler(scopeTimeout.apply, scope, '$apply', fun)
          }
      }
    }

    return new factory;
});
