'use strict';

angular.module('ngIvrApp')
  .controller('SettingsCtrl', function ($scope, User, Auth) {
    $scope.errors = {};

    $scope.changePassword = function(form) {
      if ($scope.user.newPassword !== $scope.user.newPassword2) {
        $scope.message = 'A kétszer megadott jelszó nem egyezik..';
        return
      }
      $scope.submitted = true;
      if(form.$valid) {
        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
        .then( function() {
          $scope.message = 'A jelszó megváltoztatva.';
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Hibás jelszó!';
          $scope.message = '';
        });
      }
		};
  });
