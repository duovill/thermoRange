'use strict';

angular.module('ngIvrApp')
  .config(function ($stateProvider) {
    return;
    $stateProvider
      .state('admin', {
        url: '/admin',
        templateUrl: 'app/admin/admin.html',
        controller: 'AdminCtrl'
      });
  });
