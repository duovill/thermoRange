/**
 * Created by Kovács Marcell on 2017.03.29..
 */

'use strict';


angular.module('ngIvrApp')
  .controller('sidebarCtrl', function ($scope, $rootScope, $http, socket, $location, Auth, $window, Common, $mdSidenav, ngivrSocketLock, ngivrLockService) {
    const start = async () => {
      $scope.socketService = ngivrSocketLock;
      $scope.locklist = [];
      $scope.ngivrLockService = ngivrLockService;
      $scope.getSocketLock = function(){
        $scope.socketService.get();
      };


      socket.socket.on(ngivr.settings.socket.event.lock.list.update, function (data) {
        $scope.locklist = data.data;
      });

      /*
      Auth.isLoggedInAsync(async function(loggedIn) {
        if (loggedIn) {
          let resp = await ngivrLockService.getAllLocks();
          $scope.redisLockList = resp.data;
        }
      });
      */

      // let lockResp = await ngivrLockService.getAllLocks();
      // $scope.redisLockList = lockResp.data;

        // ezt majd subscribe-al hasznaljuk
        /*
        ngivrLockService.subscribe((locks, locksMy, locksOthers) => {
            $scope.redisLockList = locks;
        });
         */
      const lockListener = async (data) => {
          // ide mindig tegyunk try/catch
        $scope.redisLockList = data.locks
      };

      socket.socket.on('ngivr-lock-response-get-locks', lockListener);

      $scope.$on('$destroy', async () => {
        socket.socket.removeListener('ngivr-lock-response-get-locks', lockListener);
      });
      //$scope.socketService.get();

      $scope.openLockModel = function(lock){
        let url = '/'+lock.data.schema;
        url += 's/';
        url += lock.data.model._id;
        $location.path(url);
      };

      $scope.toggleLeft = buildToggler('left');
      $scope.toggleRight = buildToggler('right');

      function buildToggler(componentId) {
        return async function() {
          $mdSidenav(componentId).toggle();
          $scope.getSocketLock();
          Auth.isLoggedInAsync(async function(loggedIn) {
            if (loggedIn) {
              let resp = await ngivrLockService.getAllLocks();
              $scope.redisLockList = resp.data;
            }
          });
          $window.scrollTo(0, 0);
        };
      }
    };

    start()
  });
