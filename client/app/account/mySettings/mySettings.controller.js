/**
 * Created by Kovács Marcell on 2017.03.02..
 */
'use strict';

angular.module('ngIvrApp')
  .controller('MySettingsCtrl', function ($scope, User, Auth, syncedCache, $http) {
    $scope.errors = {};
    $scope.user = Auth.getCurrentUser();
    $scope.menus = [];
    //$scope.quickNavLinks = $rootScope.user.quickNavLinks;

        $http.get('/api/menus').then(function(response) {    //szerződések lekérdezése
          let menus = response.data;

          for (var i = 0; i < $scope.user.quickNavLinks.length; i++) {
            let menu = menus.filter(function (obj) {
              if ($scope.user.quickNavLinks[i] != null)
              {
                return obj._id == $scope.user.quickNavLinks[i]._id;
              }
              else
                return false;
            })[0];

            if (menu != undefined)
            {
              $scope.user.quickNavLinks[i] = menu;
            }
          }

        });

    // $scope.menu = {
    //   name: 'Teszt',
    //   resource: [{
    //     lang: {
    //       name: 'Magyar',
    //       code: 'HU-hu',
    //       icon: ''
    //     },
    //     title: 'Teszt'
    //   }],
    //   route: 'allContracts',
    //   icon: 'icon-home',
    //   role: [ 'Admin logisztikus',
    //           'Hedger',
    //           'Admin global'],
    //   visible:true
    // };

    // $http.post('/api/menus', $scope.menu).then(function (menus) {
    //
    // });

    Promise.all([syncedCache.getMenus()]).then(function (data) {
      $scope.menus = data[0].filter(function (obj) {
        return obj.role.some(function (obj2) {
          return obj2 == $scope.user.role;
        });
      });
    });

    if ($scope.user.quickNavLinks.length < 5){
      let count = 5-$scope.user.quickNavLinks.length;
      for (var i = 0; i < count; i++) {
        $scope.user.quickNavLinks.push(null);
      }
    }

    $scope.changeQuickNavLinks = function(form) {
      $scope.submitted = true;
      if(form.$valid) {
        // for (var i = 0; i < $scope.user.quickNavLinks.length; i++) {
        //   if ($scope.user.quickNavLinks[i] != null) {
        //     $scope.user.quickNavLinks[i] = $scope.menus.filter(function (obj) {
        //         return obj._id == $scope.user.quickNavLinks[i];
        //       })[0];
        //   }
        // }
        Auth.changequickNavLinks( $scope.user.quickNavLinks )
          .then( function() {
            $scope.message = 'A linkek megváltoztatva.';
          })
          .catch( function(err) {
            $scope.message = err;
          });
      }
    };
  });
